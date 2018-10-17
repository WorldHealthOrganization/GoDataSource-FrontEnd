import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/chronology.component';

@Component({
    selector: 'app-view-chronology-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-chronology-contact.component.html',
    styleUrls: ['./view-chronology-contact.component.less']
})
export class ViewChronologyContactComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    contactData: ContactModel = new ContactModel();
    chronologyEntries: any[] = [];

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
                                    'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.contactData
                                )
                            );

                            // create entries array.
                            const chronologyEntries: ChronologyItem[] = [];

                            // date of onset
                            if (!_.isEmpty(this.contactData.dateOfReporting)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.contactData.dateOfReporting,
                                    label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'
                                }));
                            }
                            // date deceased
                            if (!_.isEmpty(this.contactData.dateDeceased)) {
                                chronologyEntries.push(new ChronologyItem({
                                    date: this.contactData.dateDeceased,
                                    label: 'LNG_CONTACT_FIELD_LABEL_DATE_DECEASED'
                                }));
                            }

                            // set data
                            this.chronologyEntries = chronologyEntries;
                        });
                });


        });
    }
}
