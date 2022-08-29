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
    private authDataService: AuthDataService
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

              const qb = new RequestQueryBuilder();
              qb.include('people', true);

              if (this.contactOfContactData) {
                // get relationships
                this.relationshipDataService
                  .getEntityRelationships(
                    selectedOutbreak.id,
                    this.contactOfContactData.type,
                    this.contactOfContactData.id,
                    qb
                  ).subscribe((relationshipsData) => {
                    // set data
                    this.chronologyEntries = ContactOfContactChronology.getChronologyEntries(
                      this.contactOfContactData,
                      relationshipsData
                    );
                  });
              }
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
