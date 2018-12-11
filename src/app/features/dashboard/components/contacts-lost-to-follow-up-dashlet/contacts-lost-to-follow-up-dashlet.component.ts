import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { MetricContactsLostToFollowUpModel } from '../../../../core/models/metrics/metric-contacts-lost-to-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Subscription } from 'rxjs/Subscription';
import * as moment from 'moment';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

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
    Constants = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

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
    }

    /**
     * Refresh data
     */
    refreshData() {
        // get the number of contacts who are lost to follow-up
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // no date provided, then we need to set the default one
            // filter by day - default - yesterday
            let date = this.globalFilterDate;
            if (!date) {
                date = moment().add(-1, 'days');
            }

            // date condition
            qb.filter.byEquality(
                'date',
                moment(date).format('YYYY-MM-DD')
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // location
            if (this.globalFilterLocationId) {
                qb.filter.byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
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
