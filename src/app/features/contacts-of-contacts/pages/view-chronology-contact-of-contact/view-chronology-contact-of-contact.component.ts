import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ChronologyItem } from '../../../../shared/components/chronology/typings/chronology-item';
import { UserModel } from '../../../../core/models/user.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ActivatedRoute } from '@angular/router';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactOfContactChronology } from './typings/contact-of-contact-chronology';

@Component({
    selector: 'app-view-chronology-contact-of-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-chronology-contact-of-contact.component.html',
    styleUrls: ['./view-chronology-contact-of-contact.component.less']
})
export class ViewChronologyContactOfContactComponent implements OnInit {

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    contactOfContactData: ContactOfContactModel = new ContactOfContactModel();
    chronologyEntries: ChronologyItem[] = [];

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
        private i18nService: I18nService,
        private authDataService: AuthDataService,
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
                                        this.i18nService,
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
        this.breadcrumbs = [];

        // contacts of contacts list page
        if (ContactOfContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '/contacts-of-contacts')
            );
        }

        // contact of contact breadcrumbs
        if (this.contactOfContactData) {
            // contacts view page
            if (ContactOfContactModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.contactOfContactData.name,
                        `/contacts-of-contacts/${this.contactOfContactData.id}/view`
                    )
                );
            }

            // current page
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_OF_CONTACT_TITLE',
                    '.',
                    true,
                    {},
                    this.contactOfContactData
                )
            );
        }
    }

}
