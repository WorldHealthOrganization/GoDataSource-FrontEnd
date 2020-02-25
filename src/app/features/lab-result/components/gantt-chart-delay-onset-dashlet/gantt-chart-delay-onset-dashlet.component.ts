import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { SVGGantt } from 'gantt';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../../../core/models/metrics/metric-cases-delay-between-onset-lab-test.model';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { Subscription ,  Subscriber } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-gantt-chart-delay-onset-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './gantt-chart-delay-onset-dashlet.component.html',
    styleUrls: ['./gantt-chart-delay-onset-dashlet.component.less']
})
export class GanttChartDelayOnsetDashletComponent implements OnInit, OnDestroy {
    // constants
    Constants = Constants;

    // gantt chart settings
    ganttChart: any;
    ganttData: any = [];
    options = {
        // View mode: day/week/month
        viewMode: Constants.GANTT_CHART_VIEW_TYPE.DAY.value,
        onClick: () => {},
        styleOptions: {
            baseBar: '#4DB0A0'
        },
        legends: []
    };

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;
    refdataSubscriber: Subscription;

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
        private referenceDataDataService: ReferenceDataDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // retrieve ref data
        this.displayLoading = true;
        this.refdataSubscriber = this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE)
            .subscribe((personTypes) => {
                const casePersonType = _.find(personTypes.entries, {value: EntityType.CASE});
                if (casePersonType) {
                    this.options.styleOptions.baseBar = casePersonType.colorCode;

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
     * display the gantt chart
     */
    displayChart() {
        // remove existing element then create the new one
        const elem = document.getElementById('gantt-svg-root');
        if (elem) {
            elem.innerHTML = '';
        }

        // only display id data is available
        if (
            !_.isEmpty(this.ganttData) &&
            !_.isEmpty(this.ganttData[0].children)
        ) {
            this.ganttChart = new SVGGantt(
                '#gantt-svg-root',
                this.ganttData,
                this.options
            );
        }
    }

    /**
     * format the data in the desired format
     */
    formatData(metricResults: MetricCasesDelayBetweenOnsetLabTestModel[]) {
        // initialize
        this.ganttData = [];
        const chartDataItem: any = {};
        chartDataItem.id = '';
        chartDataItem.name = '';
        chartDataItem.children = [];

        // add data
        _.forEach(metricResults, (result) => {
            if (
                !_.isEmpty(result.dateOfOnset) &&
                !_.isEmpty(result.dateSampleTaken) &&
                result.delay > 0
            ) {
                const chartDataItemChild: any = {};
                chartDataItemChild.id = result.case.id;
                chartDataItemChild.name = result.case.name;
                chartDataItemChild.from = new Date(Date.parse(result.dateOfOnset));
                chartDataItemChild.to = new Date(Date.parse(result.dateSampleTaken));
                chartDataItem.children.push(chartDataItemChild);
            }
        });

        // finished
        this.ganttData.push(chartDataItem);
    }

    /**
     * trigger change view: days, months, weeks
     * @param viewType
     */
    changeView(viewType) {
        // configure new settings
        this.options.viewMode = viewType;

        // re-render chart
        this.displayChart();
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

            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

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

            // load data and display chart
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getDelayBetweenOnsetAndLabTesting(this.outbreakId, qb)
                .subscribe((results) => {
                    // configure data
                    this.formatData(results);

                    // bind properties => show container
                    this.displayLoading = false;
                    setTimeout(() => {
                        this.displayChart();
                    });
                });
        }
    }

    /**
     * Check if graph has data
     */
    hasData(): boolean {
        return _.get(this.ganttData, '[0].children.length', 0) > 0;
    }
}
