import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs/Subscription';
import * as moment from 'moment';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-new-cases-previous-days-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-cases-previous-days-transmission-chains-dashlet.component.html',
    styleUrls: ['./new-cases-previous-days-transmission-chains-dashlet.component.less']
})
export class NewCasesPreviousDaysTransmissionChainsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of cases in previous x days in known transmission chains
    casesKnownTransmissionChainsCount: number = 0;
    // nr of new cases
    totalCases: number = 0;
    // x metric set on outbreak
    xPreviousDays: number;
    // constants to be used for applyListFilters
    Constants = Constants;

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
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of cases in previous x days in known transmission chains
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.xPreviousDays = selectedOutbreak.noDaysInChains;
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
     * Triggers when the value of the no of days is changed in UI
     * @param newXPreviousDays
     */
    onChangeSetting(newXPreviousDays) {
        // get number of cases in previous x days in known transmission chains
        this.xPreviousDays = newXPreviousDays;
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
            let xPreviousDays: number = _.isNumber(this.xPreviousDays) || _.isEmpty(this.xPreviousDays) ? this.xPreviousDays  : _.parseInt(this.xPreviousDays);
            if (_.isNumber(xPreviousDays)) {
                // add number of days until current day
                if (this.globalFilterDate) {
                    xPreviousDays += moment().endOf('day').diff(moment(this.globalFilterDate).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysInChains',
                    xPreviousDays
                );
            }

            // date
            if (this.globalFilterDate) {
                qb.filter.where({
                    contactDate: {
                        lte: moment(this.globalFilterDate).toISOString()
                    }
                });
            }

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.relationshipDataService
                .getCountOfCasesOutsideTheTransmissionChains(this.outbreakId, qb)
                .subscribe((result) => {
                    this.casesKnownTransmissionChainsCount = result.newCases;
                    this.totalCases = result.total;
                    this.displayLoading = false;
                });
        }
    }
}


