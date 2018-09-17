import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { Constants } from '../../../../core/models/constants';
import { Moment } from 'moment';
import * as moment from 'moment';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import * as _ from 'lodash';
import { MetricContactsWithSuccessFollowUP } from '../../../../core/models/metrics/metric.contacts-with-success-follow-up.model';

@Component({
    selector: 'app-contacts-with-successful-follow-ups-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-with-successful-follow-ups-dashlet.component.html',
    styleUrls: ['./contacts-with-successful-follow-ups-dashlet.component.less']
})
export class ContactsWithSuccessfulFollowUpsDashletComponent implements OnInit {

    // contacts with successfulFollowup
    contactsWithSuccessfulFollowup;

    // filter by day
    date: Moment = moment();

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_SEEN
    };

    // constants to be used for applyListFilter
    Constants: any = Constants;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));

    constructor(
        private listFilterDataService: ListFilterDataService
    ) {
    }

    ngOnInit() {
        this.triggerUpdateValues.call(true);
    }

    onDateChanged(date) {
        this.date = date;

        // update
        this.triggerUpdateValues.call();
    }

    /**
     * Update list
     */
    updateValues() {
        if (_.isEmpty(this.date) || !this.date.isValid()) {
            this.date = moment();
        }

        this.queryParams.date = this.date.toISOString();

        // get the results for contacts seen
        this.listFilterDataService.filterContactsWithSuccessfulFollowup(this.date)
            .subscribe((result: MetricContactsWithSuccessFollowUP) => {
                this.contactsWithSuccessfulFollowup = result;
            });
    }

    /**
     * Calculate percentage of successfully follow-up for specific date
     * @returns {number}
     */
    calculatePercent() {
        return this.contactsWithSuccessfulFollowup ?
            Math.round(100 * this.contactsWithSuccessfulFollowup.contactsWithSuccessfulFollowupsCount / this.contactsWithSuccessfulFollowup.totalContactsWithFollowupsCount) : 0;
    }
}
