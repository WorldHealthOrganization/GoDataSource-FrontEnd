import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MetricContactsSeenEachDays } from '../../../../core/models/metrics/metric-contacts-seen-each-days.model';
import { Constants } from '../../../../core/models/constants';
import { Subscriber } from 'rxjs/Subscriber';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Moment } from 'moment';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'app-contacts-seen-each-day-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-seen-each-day-dashlet.component.html',
    styleUrls: ['./contacts-seen-each-day-dashlet.component.less']
})
export class ContactsSeenEachDayDashletComponent implements OnInit {

    // number of contacts seen each day
    contactsSeenEachDay: number;

    // filter by date
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
        private listFilterDataService: ListFilterDataService) {
    }

    ngOnInit() {
        this.triggerUpdateValues.call(true);
    }

    onDateChanged(date) {
        this.date = date;

        // update
        this.triggerUpdateValues.call();
    }

    updateValues () {
        if (_.isEmpty(this.date) || !this.date.isValid()) {
            this.date = moment();
        }

        this.queryParams.date = this.date.toISOString();

        // get the results for contacts seen
        this.listFilterDataService.filterContactsSeen(this.date)
            .subscribe((result: MetricContactsSeenEachDays) => {
                this.contactsSeenEachDay = result.contactsSeenCount;
            });
    }
}
