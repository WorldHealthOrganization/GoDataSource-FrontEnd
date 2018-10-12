import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';

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

    constructor(
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
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
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    contactDataReturned.name,
                                    `/contacts/${contactDataReturned.id}/view`),
                                new BreadcrumbItemModel(
                                    'LNG_PAGE_VIEW_MOVEMENT_CONTACT_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.contactData
                                )
                            );
                        });
                });


        });
    }
}
