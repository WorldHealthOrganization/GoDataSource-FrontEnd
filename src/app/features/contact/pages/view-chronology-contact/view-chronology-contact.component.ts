import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
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
    chronologyEntries: ChronologyItem[] = [];

    constructor(
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService
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

                            // build query to get the followUps for specified contact
                            const qb = new RequestQueryBuilder;
                            qb.filter.byEquality(
                                'personId',
                                this.contactData.id
                            );
                            // get followUps for specified contact
                            this.followUpsDataService
                                .getFollowUpsList(selectedOutbreak.id, qb)
                                .subscribe((followUps: FollowUpModel[]) => {
                                    // set data
                                    this.chronologyEntries = ContactChronology.getChronologyEntries(this.contactData, followUps);
                                });
                        });
                });
        });
    }
}
