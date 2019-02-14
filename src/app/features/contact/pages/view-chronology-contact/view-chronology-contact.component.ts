import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ChronologyItem } from '../../../../shared/components/chronology/chronology.component';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';

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
        private followUpsDataService: FollowUpsDataService,
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
                                    this.chronologyEntries = this.getChronologyEntries(this.contactData, followUps);
                            });
                        });
                });
        });
    }

    getChronologyEntries(contactData: ContactModel, followUps: FollowUpModel[]) {
        const chronologyEntries: ChronologyItem [] = [];

        // build chronology items from followUp
        _.forEach(followUps, (followUp: FollowUpModel) => {
            if (!_.isEmpty(followUp.date)) {
                chronologyEntries.push(new ChronologyItem({
                    date: followUp.date,
                    label: followUp.statusId
                }));
            }
        });

        // date of onset
        if (!_.isEmpty(contactData.dateOfReporting)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactData.dateOfReporting,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'
            }));
        }

        // date become contact
        if (!_.isEmpty(contactData.dateBecomeContact)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactData.dateBecomeContact,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT'
            }));
        }

        // follow-up start date
        if (!_.isEmpty(contactData.followUp.startDate)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactData.followUp.startDate,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_START_OF_FOLLOWUP'
            }));
        }

        // follow-up end date
        if (!_.isEmpty(contactData.followUp.endDate)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactData.followUp.endDate,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP'
            }));
        }

        if (!_.isEmpty(contactData.dateOfLastContact)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactData.dateOfLastContact,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
            }));
        }

        return chronologyEntries;
    }
}
