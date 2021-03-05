import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
    selector: 'app-contacts-on-followup-list-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-on-followup-list-dashlet.component.html',
    styleUrls: ['./contacts-on-followup-list-dashlet.component.less']
})
export class ContactsOnFollowupListDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of contacts on the followup list
    contactsOnFollowUpListCount: number = 0;

    // constants to be used for applyListFilters
    ContactModel = ContactModel;

    // outbreak
    outbreakId: string;

    // for which date do we display data ?
    dataForDate: Moment = moment();

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    // query params
    queryParams: {
        [key: string]: any
    } = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST,
        [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
    };

    /**
     * Constructor
     */
    constructor(
        private followUpDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
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
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
    }

    /**
     * Component destroyed
     */
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

        // parent subscribers
        this.releaseSubscribers();
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            // classification is handled by api...
            const qb = this.getGlobalFilterQB(
                null,
                'address.parentLocationIdFilter',
                false
            );

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

            // update date
            this.dataForDate = this.globalFilterDate ?
                this.globalFilterDate.clone() :
                moment();

            // date
            if (this.globalFilterDate) {
                qb.filter
                    .byEquality(
                        'startDate',
                        this.globalFilterDate.startOf('day').toISOString()
                    ).byEquality(
                        'endDate',
                        this.globalFilterDate.endOf('day').toISOString()
                    );
            }

            // change the way we build query
            qb.filter.firstLevelConditions();

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(this.outbreakId, qb)
                .subscribe((result) => {
                    this.contactsOnFollowUpListCount = result.contactsCount;
                    this.displayLoading = false;
                });
        }
    }
}
