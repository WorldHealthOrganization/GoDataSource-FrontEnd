import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { Subscription, Subscriber, throwError, forkJoin } from 'rxjs';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Moment } from 'moment';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';
import { Router } from '@angular/router';
import * as _ from 'lodash';
@Component({
    selector: 'app-cases-hospitalized-pie-chart-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalized-pie-chart-dashlet.component.html',
    styleUrls: ['./cases-hospitalized-pie-chart-dashlet.component.less']
})
export class CasesHospitalizedPieChartDashletComponent implements OnInit, OnDestroy {
    caseHospitalizationSummaryResults: any = [];

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
        private caseDataService: CaseDataService,
        private i18nService: I18nService,
        protected snackbarService: SnackbarService,
        private router: Router
    ) {
    }

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
     * Redirect to cases page when user click on a piece of pie chart to display the cases that represent the part of pie chart
     */
    onDoughnutPress(pressed) {
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

        this.router.navigate([`cases`],
            {
                queryParams: {
                    global: JSON.stringify(global),
                    applyListFilter: Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED,
                    x: pressed.extra,
                }
            });
    }

    /**
     * Build chart data object
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(caseHospitalizationCount, caseIsolationCount, caseListCount) {
        const caseHospitalizationSummaryResults: MetricChartDataModel[] = [];

        // check for no data
        if (
            caseHospitalizationCount === 0 &&
            caseIsolationCount === 0 &&
            caseListCount === 0
        ) {
            return caseHospitalizationSummaryResults;
        }

        caseHospitalizationSummaryResults.push(new MetricChartDataModel({
            value: caseHospitalizationCount,
            name: this.i18nService.instant('LNG_PAGE_DASHBOARD_CASE_HOSPITALIZATION_CASES_HOSPITALIZED_LABEL'),
        }));
        caseHospitalizationSummaryResults.push(new MetricChartDataModel({
            value: caseIsolationCount,
            name: this.i18nService.instant('LNG_PAGE_DASHBOARD_CASE_HOSPITALIZATION_CASES_ISOLATED_LABEL'),
        }));

        const caseNotHospitalized = caseListCount - caseHospitalizationCount - caseIsolationCount;
        caseHospitalizationSummaryResults.push(new MetricChartDataModel({
            value: caseNotHospitalized,
            name: this.i18nService.instant('LNG_PAGE_DASHBOARD_CASE_HOSPITALIZATION_CASES_NOT_HOSPITALIZED_LABEL'),
        }));

        return caseHospitalizationSummaryResults;
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
            this.previousSubscriber = forkJoin(
                this.caseDataService
                    .getHospitalisedCasesCount(this.outbreakId, this.globalFilterDate, qb),
                this.caseDataService
                    .getIsolatedCasesCount(this.outbreakId, this.globalFilterDate, qb),
                this.caseDataService
                    .getCasesCount(this.outbreakId, qb)
            )
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        return throwError(err);
                    })
                )
                .subscribe(([hospitalizedCountResults, isolatedCountResults, casesCountResults]) => {
                    // construct chart
                    this.caseHospitalizationSummaryResults = this.buildChartData(
                        hospitalizedCountResults.count,
                        isolatedCountResults.count,
                        casesCountResults.count
                    );

                    // finished
                    this.displayLoading = false;
                });
        }
    }
}
