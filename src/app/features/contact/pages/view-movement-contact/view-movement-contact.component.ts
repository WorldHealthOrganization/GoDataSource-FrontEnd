import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { forkJoin } from 'rxjs';
import { AddressModel } from '../../../../core/models/address.model';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
    selector: 'app-view-movement-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-movement-contact.component.html',
    styleUrls: ['./view-movement-contact.component.less']
})
export class ViewMovementContactComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    contactData: ContactModel = new ContactModel();
    movementAddresses: AddressModel[] = [];

    @ViewChild('mapMovement') mapMovement: WorldMapMovementComponent;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { contactId }) => {
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    forkJoin(
                        this.contactDataService.getContact(selectedOutbreak.id, params.contactId),
                        this.contactDataService.getContactMovement(selectedOutbreak.id, params.contactId)
                    )
                        .subscribe((
                            [contactData, movementData]: [ContactModel, AddressModel[]]
                        ) => {
                            // contact data
                            this.contactData = contactData;

                            // initialize page breadcrumbs
                            this.initializeBreadcrumbs();

                            // movement data
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

        // contacts list page
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // contact breadcrumbs
        if (this.contactData) {
            // contacts view page
            if (ContactModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.contactData.name,
                        `/contacts/${this.contactData.id}/view`
                    )
                );
            }

            // current page
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_VIEW_MOVEMENT_CONTACT_TITLE',
                    '.',
                    true,
                    {},
                    this.contactData
                )
            );
        }
    }

    /**
     * Export movement map for contact
     */
    exportContactMovementMap() {
        this.mapMovement.exportMovementMap(EntityType.CONTACT);
    }
}
