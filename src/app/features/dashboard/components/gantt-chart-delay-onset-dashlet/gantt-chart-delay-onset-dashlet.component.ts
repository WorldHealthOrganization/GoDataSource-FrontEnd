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
import { SVGGantt, CanvasGantt, StrGantt } from 'gantt';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../../../core/models/metrics/metric-cases-delay-between-onset-lab-test.model';

@Component({
    selector: 'app-gantt-chart-delay-onset-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './gantt-chart-delay-onset-dashlet.component.html',
    styleUrls: ['./gantt-chart-delay-onset-dashlet.component.less']
})
export class GanttChartDelayOnsetDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    chartDataCategories: any = [];
    viewType = Constants.EPI_CURVE_VIEW_TYPE.MONTH.value;
    Constants = Constants;
    maxTickCulling: number = 1;

    metricResults: MetricCasesDelayBetweenOnsetLabTestModel[];
    ganttData: any;
    ganttChart: any;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {

        const options = {
            // View mode: day/week/month
            viewMode: 'month',
            onClick: (item) => {},
            styleOptions: {
                BG: '#fff',
                groupBg: '#fff',
                lineColor: '#eee',
                redLineColor: '#f04134',
                baseBar: '#b8c2cc',
                greenBar: '#52c41a',
                groupBar: '#fff',
                redBar: '#ed7f2c',
                textColor: '#222',
                lightTextColor: '#999'
            },
            legends:
                [{
                    type: 'bar',
                    name: 'Remainingaaa'
                }]
        };


        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.caseDataService
                        .getDelayBetweenOnsetAndLabTesting(selectedOutbreak.id)
                        .subscribe((results) => {
                            this.metricResults = results;
                            this.formatData();
                            console.log(this.ganttData);
                            this.ganttChart = new SVGGantt('#svg-root', this.ganttData, options);
                            // format data
                        });
                }
            });

    }

    formatData() {
        const chartData = [];
        const chartDataItem:any = {};
        chartDataItem.id = '';
        chartDataItem.name = '';
        const children = [];
        _.forEach(this.metricResults, (result) => {
            if (!_.isEmpty(result.dateOfOnset) && !_.isEmpty(result.dateOfFirstLabTest) && result.delay > 0) {
                const chartDataItemChild:any = {};
                chartDataItemChild.id = result.case.id;
                chartDataItemChild.name = result.case.firstName + ' ' + result.case.lastName;
                chartDataItemChild.from = new Date(Date.parse(result.dateOfOnset));
                chartDataItemChild.to = new Date(Date.parse(result.dateOfFirstLabTest));
                children.push(chartDataItemChild);
            }
        });
        chartDataItem.children = children;
        chartData.push(chartDataItem);
        this.ganttData = chartData;
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
       this.formatData();
    }

}
