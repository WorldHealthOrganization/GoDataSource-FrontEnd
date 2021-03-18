import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { MetricContactsLostToFollowUpModel } from '../../../../core/models/metrics/metric-contacts-lost-to-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
    selector: 'app-contacts-lost-to-follow-up-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-lost-to-follow-up-dashlet.component.html',
    styleUrls: ['./contacts-lost-to-follow-up-dashlet.component.less']
})
export class ContactsLostToFollowUpDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of contacts who are lost to follow-up
    noContactsLostToFollowUp: number;

    // provide constants to template
    ContactModel = ContactModel;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    // query params
    queryParams: {
        [key: string]: any
    } = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP,
        [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
    };

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
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
        // get number of deceased cases
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
        // get the number of contacts who are lost to follow-up
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.where({
                    dateOfReporting: {
                        lte: moment(this.globalFilterDate).toISOString()
                    }
                });
            }

            // location
            if (this.globalFilterLocationId) {
                qb.filter.byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
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

            this.displayLoading = true;
            this.previousSubscriber = this.followUpsDataService
                .getNumberOfContactsWhoAreLostToFollowUp(this.outbreakId, qb)
                .subscribe((result: MetricContactsLostToFollowUpModel) => {
                    this.noContactsLostToFollowUp = result.contactsCount;
                    this.displayLoading = false;
                });
        }
    }
}
