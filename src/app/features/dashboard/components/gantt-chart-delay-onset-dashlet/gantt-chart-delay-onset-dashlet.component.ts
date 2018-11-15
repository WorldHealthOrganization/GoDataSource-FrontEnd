import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { MetricCasesCountStratified } from '../../../../core/models/metrics/metric-cases-count-stratified.model';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as Gantt from 'frappe-gantt';

@Component({
    selector: 'app-gantt-chart-delay-onset-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './gantt-chart-delay-onset-dashlet.component.html',
    styleUrls: ['./gantt-chart-delay-onset-dashlet.component.less']
})
export class GanttChartDelayOnsetDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    caseClassificationsList: ReferenceDataEntryModel[];
    chartData: any = [];
    chartDataObject: any = {};
    metricData: MetricCasesCountStratified[];
    chartDataCategories: any = [];
    chartDataColumns: any = [];
    viewType = Constants.EPI_CURVE_VIEW_TYPE.MONTH.value;
    Constants = Constants;
    maxTickCulling: number = 1;
    mapCaseClassifications: any = {};
    colorPattern: string[] = [];

    @ViewChild('gantt') ganttEl: ElementRef;
    tasks: any;
    gantt: any;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {

        this.tasks = [
            {
                id: 'Task 1',
                name: 'Redesign website',
                start: '2016-12-28',
                end: '2016-12-31',
                progress: 20,
                dependencies: 'Task 2, Task 3'
            }];


        if (this.tasks.length) {
            this.gantt = new Gantt.default(this.ganttEl.nativeElement, this.tasks, {});
        }

        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.referenceDataDataService
                        .getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
                        .subscribe((caseClassification) => {
                            this.mapCaseClassifications = {};
                            this.caseClassificationsList = caseClassification.entries;
                            // map classifications to translation and color
                            _.forEach(this.caseClassificationsList, (caseClassificationItem, key) => {
                                this.mapCaseClassifications[caseClassificationItem.value] = {};
                                this.mapCaseClassifications[caseClassificationItem.value].valueTranslated = this.i18nService.instant(caseClassificationItem.value);
                                this.mapCaseClassifications[caseClassificationItem.value].colorCode = caseClassificationItem.colorCode;
                            });
                            // get the data
                            this.retrieveData();
                        });
                }
            });

    }

    /**
     * get the data from API
     */
    retrieveData() {
        // empty objects
        this.chartData = {};
        this.chartDataCategories = [];
        this.chartDataColumns = [];
        this.colorPattern = [];
        this.caseDataService
            .getCasesStratifiedByClassificationOverTime(this.selectedOutbreak.id, this.viewType)
            .subscribe((results) => {
                this.metricData = results;
                // convert data to chart data format
                this.chartDataObject = this.setEpiCurveResults();
                const chartDataTemp = [];
                _.forEach(Object.keys(this.chartDataObject), (key) => {
                    chartDataTemp.push(this.chartDataObject[key]);
                });
                this.chartData = chartDataTemp;
            });
    }

    /**
     * set the data needed for the chart
     */
    setEpiCurveResults() {
        const chartData = {};
        this.colorPattern = [];
        _.forEach(this.metricData, (metric, metricKey) => {
            // create the array with categories ( dates displayed on x axis )
            this.chartDataCategories.push(moment(metric.start).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
            // create an array with data for each classification
            _.forEach(Object.keys(metric.classification), (key) => {
                if (key !== Constants.CASE_CLASSIFICATION.NOT_A_CASE) {
                    if (this.mapCaseClassifications[key]) {
                        const translatedKey = this.mapCaseClassifications[key].valueTranslated;
                        if (chartData[translatedKey]) {
                            chartData[translatedKey].push(metric.classification[key]);
                        } else {
                            // the first element from the array needs to be the classification
                            this.chartDataColumns.push(translatedKey);
                            // also push the color corresponding the classification
                            this.colorPattern.push(this.mapCaseClassifications[key].colorCode);
                            chartData[translatedKey] = [];
                            chartData[translatedKey].push(translatedKey);
                            // push first value
                            chartData[translatedKey].push(metric.classification[key]);
                        }
                    }
                }
            });
        });
        return chartData;
    }

    /**
     * trigger change view: days, months, weeks
     * @param viewType
     */
    changeView(viewType) {
        this.viewType = viewType;
        if (this.viewType === Constants.EPI_CURVE_VIEW_TYPE.WEEK.value) {
            // this.maxTickCulling = this.chartDataCategories.length / 3;
        } else if (this.viewType === Constants.EPI_CURVE_VIEW_TYPE.DAY.value) {
            this.maxTickCulling = this.chartDataCategories.length / 3;
        }
        // re-render chart
        this.retrieveData();
    }

}
