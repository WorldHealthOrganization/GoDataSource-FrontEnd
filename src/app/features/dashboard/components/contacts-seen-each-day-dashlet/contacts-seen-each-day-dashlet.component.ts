import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MetricContactsSeenEachDays } from '../../../../core/models/metrics/metric-contacts-seen-each-days.model';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-contacts-seen-each-day-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-seen-each-day-dashlet.component.html',
    styleUrls: ['./contacts-seen-each-day-dashlet.component.less']
})
export class ContactsSeenEachDayDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of contacts seen each day
    contactsSeenEachDay: number;

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_SEEN
    };

    // constants to be used for applyListFilter
    Constants: any = Constants;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    previousSubscriber: Subscription;

    constructor(
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        this.refreshDataCaller.call();
    }

    ngOnDestroy() {
        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }
    }

    /**
     * Refresh data
     */
    refreshData() {
        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }

        this.displayLoading = true;
        this.previousSubscriber = this.listFilterDataService.filterContactsSeen(this.globalFilterDate, this.globalFilterLocationId)
            .subscribe((result: MetricContactsSeenEachDays) => {
                this.contactsSeenEachDay = result.contactsSeenCount;
                this.displayLoading = false;
            });
    }
}
