import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { SVGGantt, CanvasGantt, StrGantt } from 'gantt';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../../../core/models/metrics/metric-cases-delay-between-onset-lab-test.model';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';

@Component({
    selector: 'app-gantt-chart-delay-onset-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './gantt-chart-delay-onset-dashlet.component.html',
    styleUrls: ['./gantt-chart-delay-onset-dashlet.component.less']
})
export class GanttChartDelayOnsetDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    viewType = Constants.GANTT_CHART_VIEW_TYPE.WEEK.value;
    Constants = Constants;

    metricResults: MetricCasesDelayBetweenOnsetLabTestModel[];
    ganttData: any;
    ganttChart: any;

    options = {
        // View mode: day/week/month
        viewMode: Constants.GANTT_CHART_VIEW_TYPE.WEEK.value,
        onClick: (item) => {},
        styleOptions: {
            baseBar: '#4DB0A0'
        },
        legends: []
    };

    caseRefDataColor: string = '';


    constructor(
        private caseDataService: CaseDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {

        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;

                    // get case person type color
                    this.referenceDataDataService
                        .getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE)
                        .subscribe((personTypes) => {
                            const casePersonType = _.find(personTypes.entries, {value: EntityType.CASE});
                            if (casePersonType) {
                                this.caseRefDataColor = casePersonType.colorCode;
                                this.options.styleOptions.baseBar = this.caseRefDataColor;
                                // load data and display chart
                                this.caseDataService
                                    .getDelayBetweenOnsetAndLabTesting(selectedOutbreak.id)
                                    .subscribe((results) => {
                                        this.metricResults = results;
                                        this.formatData();
                                        this.displayChart();
                                    });
                            }
                        });
                }
            });
    }

    /**
     * display the gantt chart
     */
    displayChart() {
        // remove existing element then create the new one
        const elem = document.getElementById('svg-root');
        if (elem) {
            elem.innerHTML = '';
        }
        // only display id data is available
        if (!_.isEmpty(this.metricResults)) {
            this.ganttChart = new SVGGantt('#svg-root', this.ganttData, this.options);
        }
    }

    /**
     * format the data in the desired format
     */
    formatData() {
        const chartData = [];
        const chartDataItem: any = {};
        chartDataItem.id = '';
        chartDataItem.name = '';
        const children = [];
        _.forEach(this.metricResults, (result) => {
            if (!_.isEmpty(result.dateOfOnset) && !_.isEmpty(result.dateOfFirstLabTest) && result.delay > 0) {
                const chartDataItemChild: any = {};
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
        this.options.viewMode = this.viewType;
        // re-render chart
        this.displayChart();
    }

}
