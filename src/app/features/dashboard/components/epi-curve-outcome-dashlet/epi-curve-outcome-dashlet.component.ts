import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Subscription, Subscriber, Observable } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { MetricCasesCountStratifiedOutcome } from '../../../../core/models/metrics/metric-cases-count-stratified-outcome.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-epi-curve-outcome-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './epi-curve-outcome-dashlet.component.html',
    styleUrls: ['./epi-curve-outcome-dashlet.component.less']
})
export class EpiCurveOutcomeDashletComponent implements OnInit, OnDestroy {
    chartData: any = [];
    chartDataCategories: any = [];
    chartDataColumns: any = [];
    viewType = Constants.EPI_CURVE_VIEW_TYPE.WEEK.value;
    mapOutcomes: any = {};
    colorPattern: string[] = [];

    // constants
    Constants = Constants;

    epiCurveWeekViewTypes$: Observable<any[]>;
    epiCurveWeekViewType;

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

    // Global Filters => Case Classification
    private _globalFilterClassificationId: string[];
    @Input() set globalFilterClassificationId(globalFilterClassificationId: string[]) {
        this._globalFilterClassificationId = globalFilterClassificationId;
        this.refreshDataCaller.call();
    }
    get globalFilterClassificationId(): string[] {
        return this._globalFilterClassificationId;
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

    /**
     * Constructor
     */
    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private genericDataService: GenericDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // retrieve ref data
        this.displayLoading = true;
        this.refdataSubscriber = this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.OUTCOME)
            .subscribe((outcome) => {
                // map classifications to translation and color
                this.mapOutcomes = {};
                _.forEach(outcome.entries, (outcomeItem) => {
                    this.mapOutcomes[outcomeItem.value] = {};
                    this.mapOutcomes[outcomeItem.value].valueTranslated = this.i18nService.instant(outcomeItem.value);
                    this.mapOutcomes[outcomeItem.value].colorCode = outcomeItem.colorCode;
                });

                // outbreak subscriber
                if (this.outbreakSubscriber) {
                    this.outbreakSubscriber.unsubscribe();
                    this.outbreakSubscriber = null;
                }

                // outbreak
                this.outbreakSubscriber = this.outbreakDataService
                    .getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        if (selectedOutbreak) {
                            this.outbreakId = selectedOutbreak.id;
                            this.refreshDataCaller.call();
                        }
                    });
            });
        // load epi curves week types
        this.epiCurveWeekViewTypes$ = this.genericDataService.getEpiCurvesWeekTypes();
        this.epiCurveWeekViewType = Constants.EPI_CURVE_WEEK_TYPES.ISO.value;
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

        // ref data
        if (this.refdataSubscriber) {
            this.refdataSubscriber.unsubscribe();
            this.refdataSubscriber = null;
        }

        // debounce caller
        if (this.refreshDataCaller) {
            this.refreshDataCaller.unsubscribe();
            this.refreshDataCaller = null;
        }
    }

    /**
     * set the data needed for the chart
     */
    setEpiCurveResults(metricData: MetricCasesCountStratifiedOutcome[]) {
        // initialize data
        this.colorPattern = [];
        this.chartDataCategories = [];
        this.chartDataColumns = [];
        const chartData = {};

        // build chart data
        _.forEach(metricData, (metric: MetricCasesCountStratifiedOutcome) => {
            // create the array with categories ( dates displayed on x axis )
            this.chartDataCategories.push(metric.start.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));

            // create an array with data for each classification
            _.each(metric.outcome, (data, key) => {
                if (key !== Constants.CASE_CLASSIFICATION.NOT_A_CASE) {
                    if (this.mapOutcomes[key]) {
                        const translatedKey = this.mapOutcomes[key].valueTranslated;
                        if (chartData[translatedKey]) {
                            chartData[translatedKey].push(data);
                        } else {
                            // the first element from the array needs to be the classification
                            this.chartDataColumns.push(translatedKey);

                            // also push the color corresponding the classification
                            this.colorPattern.push(this.mapOutcomes[key].colorCode);

                            // push first value
                            chartData[translatedKey] = [];
                            chartData[translatedKey].push(translatedKey);
                            chartData[translatedKey].push(data);
                        }
                    }
                }
            });
        });

        // finished
        return chartData;
    }

    /**
     * trigger change view: days, months, weeks
     * @param viewType
     */
    changeView(viewType) {
        this.viewType = viewType;

        // reset week type if epi view is not weekly anymore
        if (viewType !== Constants.EPI_CURVE_VIEW_TYPE.WEEK.value) {
            this.epiCurveWeekViewType = undefined;
        } else {
            this.epiCurveWeekViewType = Constants.EPI_CURVE_WEEK_TYPES.ISO.value;
        }

        // re-render chart
        this.refreshDataCaller.call();
    }

    /**
     * Refresh the list after the week type has changed
     */
    changeWeekView() {
        this.refreshDataCaller.call();
    }
    /**
     * Refresh Data
     */
    refreshData() {
        if (
            this.outbreakId &&
            !_.isEmpty(this.mapOutcomes)
        ) {
            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.byEquality(
                    'endDate',
                    this.globalFilterDate.clone().endOf('day').toISOString()
                );
            } else {
                qb.filter.byEquality(
                    'endDate',
                    moment().endOf('day').toISOString()
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.filter.byEquality(
                    'addresses.parentLocationIdFilter',
                    this.globalFilterLocationId
                );
            }

            if (this.epiCurveWeekViewType) {
                qb.filter.where({
                    'weekType': this.epiCurveWeekViewType
                });
            }

            // week type
            qb.filter.byEquality(
                'periodType',
                this.viewType
            );

            // exclude discarded cases
            qb.filter.where({
                classification: {
                    neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                }
            });

            // classification
            if (!_.isEmpty(this.globalFilterClassificationId)) {
                qb.filter.bySelect(
                    'classification',
                    this.globalFilterClassificationId,
                    false,
                    null
                );
            }

            // get data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getCasesStratifiedByOutcomeOverTime(this.outbreakId, qb)
                .subscribe((results) => {
                    // convert data to chart data format
                    this.chartData = [];
                    const chartDataObject = this.setEpiCurveResults(results);
                    _.each(chartDataObject, (data) => {
                        this.chartData.push(data);
                    });

                    // finished
                    this.displayLoading = false;
                });
        }
    }
}
