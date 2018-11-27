import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Moment } from 'moment';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-case-summary-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-summary-dashlet.component.html',
    styleUrls: ['./case-summary-dashlet.component.less']
})
export class CaseSummaryDashletComponent implements OnInit, OnDestroy {
    caseSummaryResults: any = [];
    customColors = [];

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
    caseClassificationSubscriber: Subscription;
    previousSubscriber: Subscription;

    // loading data
    displayLoading: boolean = false;

    /**
     * Global Filters changed
     */
    protected refreshDataCaller = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }), 100);

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        // case classification
        this.displayLoading = true;
        this.caseClassificationSubscriber = this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
            .subscribe((caseClassifications) => {
                this.setCustomColors(caseClassifications);
            });

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

        // case classification subscriber
        if (this.caseClassificationSubscriber) {
            this.caseClassificationSubscriber.unsubscribe();
            this.caseClassificationSubscriber = null;
        }

        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }
    }

    /**
     * Build chart data object
     * @param {CaseModel[]} casesList
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(casesList: CaseModel[]) {
        let caseSummaryResults: MetricChartDataModel[] = [];
        _.forEach(casesList, (casePerson) => {
            // ignore not a case classification
            if (casePerson.classification !== Constants.CASE_CLASSIFICATION.NOT_A_CASE) {
                const caseSummaryResult: MetricChartDataModel = _.find(caseSummaryResults, {name: casePerson.classification});
                if (caseSummaryResult) {
                    caseSummaryResult.value++;
                } else {
                    if (!_.isEmpty(casePerson.classification)) {
                        const caseSummaryResultNew: MetricChartDataModel = new MetricChartDataModel();
                        caseSummaryResultNew.name = casePerson.classification;
                        caseSummaryResultNew.value = 1;
                        caseSummaryResults.push(caseSummaryResultNew);
                    }
                }
            }
        });

        // translate the classification
        caseSummaryResults = caseSummaryResults.map((result) => {
            result.name = this.i18nService.instant(result.name);
            return result;
        });

        // finished
        return caseSummaryResults;
    }

    /**
     * Set custom colors of the chart - based on those chosen in ref data
     */
    setCustomColors(caseClassifications) {
        // construct colors
        const customColors = [];
        if (!_.isEmpty(caseClassifications)) {
            _.forEach(caseClassifications.entries, (entry) => {
                const customColor: MetricChartDataModel = new MetricChartDataModel();
                customColor.name = this.i18nService.instant(entry.value);
                customColor.value = entry.colorCode;
                customColors.push(customColor);
            });
        }

        // set colors
        this.customColors = customColors;
    }

    /**
     * Refresh Data
     */
    refreshData() {
        // get the results for hospitalised cases
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
                .getCasesList(this.outbreakId, qb)
                .subscribe((casesList) => {
                    this.caseSummaryResults = this.buildChartData(casesList);
                    this.displayLoading = false;
                });
        }
    }
}
