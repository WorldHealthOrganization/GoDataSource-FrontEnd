import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';

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
                                    'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_TITLE',
                                    '.',
                                    true,
                                    {},
                                    this.contactData
                                )
                            );

                            // create entries array.
                            // date of onset
                            if (!_.isEmpty(this.contactData.dateOfReporting)) {
                                this.chronologyEntries.push({date: this.contactData.dateOfReporting, label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'});
                            }
                            // date deceased
                            if (!_.isEmpty(this.contactData.dateDeceased)) {
                                this.chronologyEntries.push({date: this.contactData.dateDeceased, label: 'LNG_CASE_FIELD_LABEL_DATE_DECEASED'});
                            }

                            // sort collection asc
                            this.chronologyEntries = _.sortBy(this.chronologyEntries, 'date');
                        });
                });


        });
    }
}
