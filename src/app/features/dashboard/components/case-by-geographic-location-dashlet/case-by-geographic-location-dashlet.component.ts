import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import * as _ from 'lodash';
import { MetricLocationCasesCountsModel } from '../../../../core/models/metrics/metric-location-cases-count.model';
import { Subscription } from 'rxjs/Subscription';
import { Moment } from 'moment';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-case-by-geographic-location-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-by-geographic-location-dashlet.component.html',
    styleUrls: ['./case-by-geographic-location-dashlet.component.less']
})
export class CasesByGeographicLocationDashletComponent implements OnInit, OnDestroy {
    casesLocationResults: any = [];

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

    // loading data
    displayLoading: boolean = true;

    /**
     * Global Filters changed
     */
    protected refreshDataCaller = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }), 100);

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService
    ) {}

    ngOnInit() {
        // outbreak
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
     * Build chart data object
     * @param {MetricLocationCasesCountsModel[]} locationsMetric
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(locationsMetric: MetricLocationCasesCountsModel[]) {
        const caseLocationSummaryResults: MetricChartDataModel[] = [];
        _.forEach(locationsMetric, (locationMetric) => {
            if (locationMetric.casesCount > 0) {
                const caseLocationSummaryResult: MetricChartDataModel = new MetricChartDataModel();
                caseLocationSummaryResult.name = locationMetric.location.name;
                caseLocationSummaryResult.value = locationMetric.casesCount;
                caseLocationSummaryResults.push(caseLocationSummaryResult);
            }
        });

        // finished
        return caseLocationSummaryResults;
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

            // construct query builder
            const qb = new RequestQueryBuilder();

            // date
            if (this.globalFilterDate) {
                qb.filter.byDateRange(
                    'dateOfOnset', {
                        startDate: this.globalFilterDate.startOf('day').format(),
                        endDate: this.globalFilterDate.endOf('day').format()
                    }
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.filter.byEquality(
                    'addresses.parentLocationIdFilter',
                    this.globalFilterLocationId
                );
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getCasesPerLocation(this.outbreakId, qb)
                .subscribe((locationsMetric) => {
                    this.casesLocationResults = this.buildChartData(locationsMetric.locations);
                    this.displayLoading = false;
                });
        }
    }
}
