import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber, Subscription } from 'rxjs';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-contacts-not-seen-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-not-seen-dashlet.component.html',
    styleUrls: ['./contacts-not-seen-dashlet.component.less']
})
export class ContactsNotSeenDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of days defined on outbreak (x)
    xDaysNotSeen: number;

    // number of contacts not seen in x days
    contactsNotSeenCount: number;

    // constants to be used for applyListFilters
    Constants: any = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }));

    constructor(
        private followUpDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of not seen contacts
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.xDaysNotSeen = selectedOutbreak.noDaysNotSeen;
                    this.refreshDataCaller.call();
                }
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }

        // debounce caller
        if (this.triggerUpdateValues) {
            this.triggerUpdateValues.unsubscribe();
            this.triggerUpdateValues = null;
        }

        // parent subscribers
        this.releaseSubscribers();
    }

    /**
     * Triggers when the value of the no of days not seen is changed in UI
     * @param newXDaysNotSeen
     */
    onChangeSetting(newXDaysNotSeen) {
        // get number of not seen contacts
        this.xDaysNotSeen = newXDaysNotSeen;
        this.triggerUpdateValues.call();
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // convert
            let xDaysNotSeen: number = _.isNumber(this.xDaysNotSeen) || _.isEmpty(this.xDaysNotSeen) ? this.xDaysNotSeen : _.parseInt(this.xDaysNotSeen);
            if (_.isNumber(xDaysNotSeen)) {
                // add number of days until current day
                if (this.globalFilterDate) {
                    xDaysNotSeen += moment().endOf('day').diff(moment(this.globalFilterDate).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysNotSeen',
                    xDaysNotSeen
                );
            }

            // date
            if (this.globalFilterDate) {
                qb.filter.where({
                    date: {
                        lte: moment(this.globalFilterDate).toISOString()
                    }
                });
            }

            // location
            if (this.globalFilterLocationId) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // classification
            // !!! must be on first level and not under $and
            if (!_.isEmpty(this.globalFilterClassificationId)) {
                qb.filter.bySelect(
                    'classification',
                    this.globalFilterClassificationId,
                    false,
                    null
                );
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.followUpDataService
                .getCountIdsOfContactsNotSeen(this.outbreakId, qb)
                .subscribe((result) => {
                    this.contactsNotSeenCount = result.contactsCount;
                    this.displayLoading = false;
                });
        }
    }
}


