import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ContactChronology } from './typings/contact-chronology';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { EntityType } from '../../../../core/models/entity-type';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-view-chronology-contact',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './view-chronology-contact.component.html',
  styleUrls: ['./view-chronology-contact.component.less']
})
export class ViewChronologyContactComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  contactData: ContactModel = new ContactModel();
  chronologyEntries: ChronologyItem[];

  // authenticated user details
  authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private contactDataService: ContactDataService,
    private outbreakDataService: OutbreakDataService,
    private followUpsDataService: FollowUpsDataService,
    private relationshipDataService: RelationshipDataService,
    private i18nService: I18nService,
    private authDataService: AuthDataService,
    private labResultDataService: LabResultDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.route.params.subscribe((params: { contactId }) => {
      // get current outbreak
      this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((selectedOutbreak: OutbreakModel) => {
          // get contact
          this.contactDataService
            .getContact(selectedOutbreak.id, params.contactId)
            .subscribe((contactDataReturned) => {
              this.contactData = contactDataReturned;

              // initialize page breadcrumbs
              this.initializeBreadcrumbs();

              // build query to get the followUps for specified contact
              const qb = new RequestQueryBuilder;
              qb.filter.byEquality(
                'personId',
                this.contactData.id
              );

              // build query to get the people for all relationships
              const qqb = new RequestQueryBuilder();
              qqb.include('people', true);

              forkJoin([
                // get relationships
                this.relationshipDataService
                  .getEntityRelationships(
                    selectedOutbreak.id,
                    this.contactData.type,
                    this.contactData.id,
                    qqb
                  ),

                // get follow-ups
                this.followUpsDataService.getFollowUpsList(selectedOutbreak.id, qb),

                // get lab results
                !selectedOutbreak.isContactLabResultsActive ?
                  of<LabResultModel[]>([]) :
                  this.labResultDataService
                    .getEntityLabResults(
                      selectedOutbreak.id,
                      EntityModel.getLinkForEntityType(EntityType.CONTACT),
                      this.contactData.id
                    )
              ]).subscribe(([
                relationshipsData,
                followUps,
                labResults
              ]: [
                RelationshipModel[],
                FollowUpModel[],
                LabResultModel[]
              ]) => {
                // set data
                this.chronologyEntries = ContactChronology.getChronologyEntries(
                  this.i18nService,
                  this.contactData,
                  followUps,
                  relationshipsData,
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
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // view page
    if (this.contactData) {
      if (ContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this.contactData.name,
          action: {
            link: [`/contacts/${this.contactData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_TITLE',
        action: null
      });
    }
  }
}
