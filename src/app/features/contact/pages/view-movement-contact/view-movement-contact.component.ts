import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { AddressModel } from '../../../../core/models/address.model';
import { WorldMapMovementComponent } from '../../../../shared/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-view-movement-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-movement-contact.component.html',
    styleUrls: ['./view-movement-contact.component.less']
})
export class ViewMovementContactComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    contactData: ContactModel = new ContactModel();
    movementAddresses: AddressModel[] = [];

    @ViewChild('mapMovement') mapMovement: WorldMapMovementComponent;

    constructor(
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params: { contactId }) => {
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    Observable.forkJoin([
                        this.contactDataService.getContact(selectedOutbreak.id, params.contactId),
                        this.contactDataService.getContactMovement(selectedOutbreak.id, params.contactId)
                    ]).subscribe((
                        [contactData, movementData]: [ContactModel, AddressModel[]]
                    ) => {
                        // contact data
                        this.contactData = contactData;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.contactData.name,
                                `/contacts/${this.contactData.id}/view`
                            ),
                            new BreadcrumbItemModel(
                                'LNG_PAGE_VIEW_MOVEMENT_CONTACT_TITLE',
                                '.',
                                true,
                                {},
                                this.contactData
                            )
                        );

                        // movement data
                        this.movementAddresses = movementData;
                    });
                });
        });
    }

    /**
     * Export contact movement map
     */
    exportContactMovementMap() {
        this.mapMovement.exportMovementMap(EntityType.CONTACT);
    }
}
