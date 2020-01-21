import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MetricContactsSeenEachDays } from '../../../../core/models/metrics/metric-contacts-seen-each-days.model';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { Subscription } from 'rxjs';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
    selector: 'app-contacts-seen-each-day-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-seen-each-day-dashlet.component.html',
    styleUrls: ['./contacts-seen-each-day-dashlet.component.less']
})
export class ContactsSeenEachDayDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of contacts seen each day
    contactsSeenEachDay: number;

    // params
    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_SEEN
    };

    // for which date do we display data ?
    dataForDate: Moment = moment();

    // constants to be used for applyListFilter
    Constants = Constants;
    ContactModel = ContactModel;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    previousSubscriber: Subscription;

    /**
     * Constructor
     */
    constructor(
        protected listFilterDataService: ListFilterDataService,
        protected authDataService: AuthDataService
    ) {
        super(
            listFilterDataService,
            authDataService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.refreshDataCaller.call();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }

        // parent subscribers
        this.releaseSubscribers();
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

        // update date
        this.dataForDate = this.globalFilterDate ?
            this.globalFilterDate.clone() :
            moment();

        this.displayLoading = true;
        this.previousSubscriber = this.listFilterDataService
            .filterContactsSeen(
                this.globalFilterDate,
                this.globalFilterLocationId,
                this.globalFilterClassificationId
            )
            .subscribe((result: MetricContactsSeenEachDays) => {
                this.contactsSeenEachDay = result.contactsSeenCount;
                this.displayLoading = false;
            });
    }
}
