import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Subscription ,  Subscriber } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { MetricContactsFollowedUpReportModel } from '../../../../core/models/metrics/metric-contacts-followed-up-report.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { FormatFunction } from 'c3';

@Component({
    selector: 'app-contact-follow-up-overview-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-follow-up-overview-dashlet.component.html',
    styleUrls: ['./contact-follow-up-overview-dashlet.component.less']
})
export class ContactFollowUpOverviewDashletComponent implements OnInit, OnDestroy {
    chartData: any = [];
    chartDataCategories: any = [];
    chartDataColumns: any = [];
    lineData: any = '';
    viewType = Constants.EPI_CURVE_VIEW_TYPE.MONTH.value;
    colorPattern: string[] = [];

    showLabels: { format: { [prop: string]: FormatFunction }};

    // constants
    Constants = Constants;

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
    outbreak: OutbreakModel;

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
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        // retrieve ref data
        this.displayLoading = true;
        // outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.outbreak = selectedOutbreak;
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

        // debounce caller
        if (this.refreshDataCaller) {
            this.refreshDataCaller.unsubscribe();
            this.refreshDataCaller = null;
        }
    }

    /**
     * set the data needed for the chart
     */
    setContactFollowUpReportResults(metricData: MetricContactsFollowedUpReportModel[]) {
        // initialize data
        this.colorPattern = [];
        this.chartDataCategories = [];
        this.chartDataColumns = [];
        const chartData = {};

        const followedUpTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_FOLLOWED_UP_LABEL');
        const notFollowedUpTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_NOT_FOLLOWED_UP_LABEL');
        const percentageTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_NOT_PERCENTAGE_LABEL');

        // set label renderer
        this.showLabels = {
            format: {
                [followedUpTranslated]: (v: number): string => {
                    return v.toString();
                },
                [notFollowedUpTranslated]: (v: number): string => {
                    return v.toString();
                },
                [percentageTranslated]: (v: number): string => {
                    return v.toString() + ' %';
                }
            }
        };

        // build chart data
        _.forEach(metricData, (metric) => {
            // create the array with categories ( dates displayed on x axis )
            this.chartDataCategories.push(moment(metric.day).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));

            if (chartData[followedUpTranslated]) {
                chartData[followedUpTranslated].push(metric.followedUp);
            } else {
                this.chartDataColumns.push(followedUpTranslated);
                this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_FOLLOWED);

                chartData[followedUpTranslated] = [];
                chartData[followedUpTranslated].push(followedUpTranslated);
                chartData[followedUpTranslated].push(metric.followedUp);
            }

            if (chartData[notFollowedUpTranslated]) {
                chartData[notFollowedUpTranslated].push(metric.notFollowedUp);
            } else {
                this.chartDataColumns.push(notFollowedUpTranslated);
                this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_NOT_FOLLOWED);

                chartData[notFollowedUpTranslated] = [];
                chartData[notFollowedUpTranslated].push(notFollowedUpTranslated);
                chartData[notFollowedUpTranslated].push(metric.notFollowedUp);
            }

            if (chartData[percentageTranslated]) {
                chartData[percentageTranslated].push(Math.round(metric.percentage));
            } else {
                // this.chartDataColumns.push('percentage');
                this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_PERCENTAGE);

                chartData[percentageTranslated] = [];
                chartData[percentageTranslated].push(percentageTranslated);
                chartData[percentageTranslated].push(Math.round(metric.percentage));
            }

        });

        this.lineData = percentageTranslated;
        // finish
        return chartData;
    }

    /**
     * Refresh Data
     */
    refreshData() {
        if ( this.outbreakId ) {
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

            // location - follow-up address
            if (this.globalFilterLocationId) {
                qb.filter.byEquality(
                    'address.parentLocationIdFilter',
                    this.globalFilterLocationId
                );
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

            // start data
            const reportData = {
                startDate: this.outbreak.startDate
            };

            // get data - start Date will be set to start of outbreak
            this.displayLoading = true;
            this.previousSubscriber = this.contactDataService
                .getContactsFollowedUpReport(this.outbreakId, reportData, qb)
                .subscribe((results) => {
                    // convert data to chart data format
                    this.chartData = [];
                    const chartDataObject = this.setContactFollowUpReportResults(results);
                    _.each(chartDataObject, (data) => {
                        this.chartData.push(data);
                    });

                    // finished
                    this.displayLoading = false;
                });
        }
    }
}
