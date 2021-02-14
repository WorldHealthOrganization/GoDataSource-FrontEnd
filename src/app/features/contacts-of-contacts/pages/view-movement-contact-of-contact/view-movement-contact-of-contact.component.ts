import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AddressModel } from '../../../../core/models/address.model';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { UserModel } from '../../../../core/models/user.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { forkJoin } from 'rxjs';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';

@Component({
    selector: 'app-view-movement-contact-of-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-movement-contact-of-contact.component.html',
    styleUrls: ['./view-movement-contact-of-contact.component.less']
})
export class ViewMovementContactOfContactComponent implements OnInit {

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    contactOfContactData: ContactOfContactModel = new ContactOfContactModel();
    movementAddresses: AddressModel[] = [];

    // loading data
    displayLoading: boolean = true;

    @ViewChild('mapMovement') mapMovement: WorldMapMovementComponent;

    // constants
    ContactOfContactModel = ContactOfContactModel;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { contactOfContactId }) => {
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    forkJoin(
                        this.contactsOfContactsDataService.getContactOfContact(selectedOutbreak.id, params.contactOfContactId),
                        this.contactsOfContactsDataService.getContactOfContactMovement(selectedOutbreak.id, params.contactOfContactId)
                    )
                        .subscribe((
                            [contactOfContactData, movementData]: [ContactOfContactModel, AddressModel[]]
                        ) => {
                            // contact of contact  data
                            this.contactOfContactData = contactOfContactData;

                            // initialize page breadcrumbs
                            this.initializeBreadcrumbs();

                            // movement data
                            this.displayLoading = false;
                            this.movementAddresses = movementData;
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
            // contact of contact view page
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
                    'LNG_PAGE_VIEW_MOVEMENT_CONTACT_OF_CONTACT_TITLE',
                    '.',
                    true,
                    {},
                    this.contactOfContactData
                )
            );
        }
    }

    /**
     * Export movement map for contact
     */
    exportContactOfContactMovementMap() {
        this.mapMovement.exportMovementMap(EntityType.CONTACT_OF_CONTACT);
    }

}
