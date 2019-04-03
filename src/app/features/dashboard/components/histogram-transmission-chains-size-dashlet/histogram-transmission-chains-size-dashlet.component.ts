import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { Moment } from 'moment';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber, Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-histogram-transmission-chains-size-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './histogram-transmission-chains-size-dashlet.component.html',
    styleUrls: ['./histogram-transmission-chains-size-dashlet.component.less']
})
export class HistogramTransmissionChainsSizeDashletComponent implements OnInit, OnDestroy {
    histogramResults: any = [];
    caseRefDataColor: string = '';

    // Global filters => Date
    private _globalFilterDate: Moment;
    @Input() set globalFilterDate(globalFilterDate: Moment) {
        this._globalFilterDate = globalFilterDate;
        this.refreshDataCaller.call();
    }

    get globalFilterDate(): Moment {
        return this._globalFilterDate;
    }

    // Global Filters => Location
    private _globalFilterLocationId: string;
    @Input() set globalFilterLocationId(globalFilterLocationId: string) {
        this._globalFilterLocationId = globalFilterLocationId;
        this.refreshDataCaller.call();
    }

    get globalFilterLocationId(): string {
        return this._globalFilterLocationId;
    }

    // outbreak
    outbreakId: string;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;
    refdataSubscriber: Subscription;

    // loading data
    displayLoading: boolean = true;

    /**
     * Global Filters changed
     */
    protected refreshDataCaller = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }), 100);

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private outbreakDataService: OutbreakDataService,
        private router: Router
    ) {
    }

    ngOnInit() {
        // get case person type color
        this.refdataSubscriber = this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE)
            .subscribe((personTypes) => {
                const casePersonType = _.find(personTypes.entries, {value: EntityType.CASE});
                if (casePersonType) {
                    this.caseRefDataColor = casePersonType.colorCode;
                }
            });

        // outbreak
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

        // ref data
        if (this.refdataSubscriber) {
            this.refdataSubscriber.unsubscribe();
            this.refdataSubscriber = null;
        }
    }

    /**
     * set the data needed for the chart
     * @param chains
     */
    setHistogramResults(chains) {
        // determine size
        const chainsSize = {};
        this.histogramResults = [];
        _.forEach(chains, (value) => {
            if (!_.isEmpty(chainsSize) && chainsSize[value.size]) {
                chainsSize[value.size]++;
            } else {
                chainsSize[value.size] = 1;
            }
        });

        // push to chart
        _.forEach(chainsSize, (value, key) => {
            this.histogramResults.push({name: key, value: value});
        });
    }

    /**
     * format the axis numbers to only display integers
     * @param data
     * @returns {string}
     */
    axisFormat(data) {
        if (data % 1 === 0) {
            return data.toLocaleString();
        } else {
            return '';
        }
    }

    /**
     * Handle click on a bar in the chart
     * Redirect to chains graph
     * @param event
     */
    onSelectChart(event) {
        const otherParams = {
            sizeOfChainsFilter: event.name
        };

        // construct global filter
        const global: {
            date?: Moment,
            locationId?: string
        } = {};

        // do we have a global date set ?
        if (!_.isEmpty(this.globalFilterDate)) {
            global.date = this.globalFilterDate;
        }

        // do we have a global location Id set ?
        if (!_.isEmpty(this.globalFilterLocationId)) {
            global.locationId = this.globalFilterLocationId;
        }

        // do we need to include global filters ?
        if (_.isEmpty(global)) {
            this.router.navigate(['/transmission-chains'], {queryParams: otherParams});
        } else {
            this.router.navigate(['/transmission-chains'], {
                queryParams: {
                    global: JSON.stringify(global),
                    ...otherParams
                }
            });
        }
    }

    /**
     * Refresh Data
     */
    refreshData() {
        if (this.outbreakId) {
            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // configure
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.byEquality(
                    'endDate',
                    this.globalFilterDate.format('YYYY-MM-DD')
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.addChildQueryBuilder('person').filter.byEquality(
                    'addresses.parentLocationIdFilter',
                    this.globalFilterLocationId
                );
            }

            // get chain data and convert to array of size and number
            this.displayLoading = true;
            this.previousSubscriber = this.transmissionChainDataService
                .getCountIndependentTransmissionChains(
                    this.outbreakId,
                    qb
                )
                .subscribe((response) => {
                    this.setHistogramResults(response.chains ? response.chains : []);
                    this.displayLoading = false;
                });
        }
    }
}
