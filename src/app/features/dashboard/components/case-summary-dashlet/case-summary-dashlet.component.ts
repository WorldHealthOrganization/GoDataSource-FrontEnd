import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber, Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Constants } from '../../../../core/models/constants';
import { Router } from '@angular/router';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { CaseModel } from '../../../../core/models/case.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

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
    caseClassificationSubscriber: Subscription;
    previousSubscriber: Subscription;

    // loading data
    displayLoading: boolean = true;

    // authenticated user
    authUser: UserModel;

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
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService,
        private i18nService: I18nService,
        private router: Router,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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

    /**
     * Component destroyed
     */
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

        // debounce caller
        if (this.refreshDataCaller) {
            this.refreshDataCaller.unsubscribe();
            this.refreshDataCaller = null;
        }
    }

    /**
     * Build chart data object
     * @returns {MetricChartDataModel[]}
     */
    buildChartData(groupedCases: {
        [classification: string]: {
            caseIDs: string[],
            count: number
        }
    }) {
        return _.transform(groupedCases, (result, caseData: { count: number }, classification: string) => {
            if (classification !== Constants.CASE_CLASSIFICATION.NOT_A_CASE) {
                result.push(new MetricChartDataModel({
                    name: this.i18nService.instant(classification),
                    value: caseData.count,
                    extra: classification
                }));
            }
        }, []);
    }

    /**
     * Redirect to cases page when user click on a piece of pie chart to display the cases that represent the part of pie chart
     */
    onDoughnutPress(pressed) {
        // we need case list permission to redirect
        if (!CaseModel.canList(this.authUser)) {
            return;
        }

        // construct redirect global filter
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

        // redirect
        this.router.navigate([`cases`],
            {
                queryParams: {
                    global: JSON.stringify(global),
                    applyListFilter: Constants.APPLY_LIST_FILTER.CASE_SUMMARY,
                    x: pressed.extra
                }
            });
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

            // ignore not a case records
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

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getCasesGroupedByClassification(this.outbreakId, qb)
                .subscribe((groupedCases) => {
                    this.caseSummaryResults = this.buildChartData(groupedCases.classification);
                    this.displayLoading = false;
                });
        }
    }
}
