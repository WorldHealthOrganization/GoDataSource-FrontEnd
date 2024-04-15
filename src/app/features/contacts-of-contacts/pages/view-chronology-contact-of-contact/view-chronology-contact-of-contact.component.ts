import { Component, OnInit } from '@angular/core';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';
import { UserModel } from '../../../../core/models/user.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ActivatedRoute } from '@angular/router';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactOfContactChronology } from './typings/contact-of-contact-chronology';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { forkJoin } from 'rxjs';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';

@Component({
  selector: 'app-view-chronology-contact-of-contact',
  templateUrl: './view-chronology-contact-of-contact.component.html'
})
export class ViewChronologyContactOfContactComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  contactOfContactData: ContactOfContactModel = new ContactOfContactModel();
  chronologyEntries: ChronologyItem[];

  // authenticated user details
  authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private contactOfContactDataService: ContactsOfContactsDataService,
    private outbreakDataService: OutbreakDataService,
    private relationshipDataService: RelationshipDataService,
    private authDataService: AuthDataService,
    private followUpsDataService: FollowUpsDataService,
    private labResultDataService: LabResultDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.route.params.subscribe((params: { contactOfContactId }) => {
      // get current outbreak
      this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((selectedOutbreak: OutbreakModel) => {
          // get case
          this.contactOfContactDataService
            .getContactOfContact(selectedOutbreak.id, params.contactOfContactId)
            .subscribe((contactOfContactDataReturned: ContactOfContactModel) => {
              this.contactOfContactData = contactOfContactDataReturned;

              // initialize page breadcrumbs
              this.initializeBreadcrumbs();

              // build query to get the followUps for specified contact
              // - used by both follow-ups and lab results
              const qb = new RequestQueryBuilder;
              qb.filter.byEquality(
                'personId',
                this.contactOfContactData.id
              );

              // build query to get the people for all relationships
              const qqb = new RequestQueryBuilder();
              qqb.include('people', true);

              forkJoin([
                // get relationships
                this.relationshipDataService
                  .getEntityRelationships(
                    selectedOutbreak.id,
                    this.contactOfContactData.type,
                    this.contactOfContactData.id,
                    qqb
                  ),

                // get follow-ups
                this.followUpsDataService.getFollowUpsList(selectedOutbreak.id, qb),

                // lab sample taken and lab result dates
                this.labResultDataService
                  .getOutbreakLabResults(
                    selectedOutbreak.id,
                    qb
                  )
              ]).subscribe(([
                relationshipData,
                followUps,
                labResults
              ]: [
                RelationshipModel[],
                FollowUpModel[],
                LabResultModel[]
              ]) => {
                // set data
                this.chronologyEntries = ContactOfContactChronology.getChronologyEntries(
                  this.contactOfContactData,
                  relationshipData,
                  followUps,
                  labResults
                );
              });
            });
        });
    });

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // list page
    if (ContactOfContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // view page
    if (this.contactOfContactData) {
      if (ContactOfContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this.contactOfContactData.name,
          action: {
            link: [`/contacts-of-contacts/${this.contactOfContactData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_OF_CONTACT_TITLE',
        action: null
      });
    }
  }

}
