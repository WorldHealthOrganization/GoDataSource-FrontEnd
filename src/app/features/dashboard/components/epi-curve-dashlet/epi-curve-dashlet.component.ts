import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { CaseModel } from '../../../../core/models/case.model';
import { MetricChartDataMultiModel } from '../../../../core/models/metrics/metric-chart-data-multi.model';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';
import { MetricCasesCountStratified } from '../../../../core/models/metrics/metric-cases-count-stratified.model';
import { Constants } from '../../../../core/models/constants';
import * as moment from 'moment';

@Component({
    selector: 'app-epi-curve-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './epi-curve-dashlet.component.html',
    styleUrls: ['./epi-curve-dashlet.component.less']
})
export class EpiCurveDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    chartData: any = [];
    casesList: CaseModel[];
    metricData: MetricCasesCountStratified[];

    // test data
    results = [
        {
            "name": "Germany",
            "series": [
                {
                    "name": "2010",
                    "value": 7300000
                },
                {
                    "name": "2011",
                    "value": 8940000
                }
            ]
        },

        {
            "name": "USA",
            "series": [
                {
                    "name": "2010",
                    "value": 7870000
                },
                {
                    "name": "2011",
                    "value": 8270000
                }
            ]
        }
    ];

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    // get chain data and convert to array of size and number
                    this.caseDataService.getCasesStratifiedByClassificationOverTime(this.selectedOutbreak.id).subscribe((results) => {
                        this.metricData = results;
                        console.log(this.metricData);
                     //   this.casesList = cases;
                       this.setEpiCurveResults();
                    });
                }
            });
    }

    // /**
    //  * set the data needed for the chart
    //  */
    // setEpiCurveResults() {
    //     // TODO - add multiple values to chart data
    //     this.chartData = [];
    //     _.forEach(this.casesList, (caseModel, key) => {
    //         if (caseModel.dateOfOnset) {
    //             let dataMultiObject: MetricChartDataMultiModel = _.find(this.chartData, (metric) => {
    //                 metric.name = caseModel.dateOfOnset;
    //             });
    //             if (dataMultiObject) {
    //                 let dataObject: MetricChartDataModel = _.find(dataMultiObject.series, (metric) => {
    //                     metric.name = caseModel.classification;
    //                 });
    //                 if (dataObject) {
    //                     dataObject.value++;
    //                 } else {
    //                     dataObject = new MetricChartDataModel();
    //                     dataObject.name = caseModel.classification;
    //                     dataObject.value = 1;
    //                     dataMultiObject.series.push(dataObject);
    //                 }
    //             } else {
    //                 dataMultiObject = new MetricChartDataMultiModel();
    //                 dataMultiObject.name = caseModel.dateOfOnset;
    //                 dataMultiObject.series = [];
    //                 const dataObject = new MetricChartDataModel();
    //                 dataObject.name = caseModel.classification;
    //                 dataObject.value = 1;
    //                 dataMultiObject.series.push(dataObject);
    //                 this.chartData.push(dataMultiObject);
    //             }
    //         }
    //     });
    //     console.log(this.chartData);
    // }

    /**
     * set the data needed for the chart
     */
    setEpiCurveResults() {
        // TODO - add multiple values to chart data
        this.chartData = [];
        _.forEach(this.metricData, (metric, key) => {
            const metricChartDataMultiModel = new MetricChartDataMultiModel();
            metricChartDataMultiModel.name = moment(metric.start).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

            _.forEach(Object.keys(metric.classification), (key) => {
                metricChartDataMultiModel.series.push({name: key, value: metric.classification[key]});
            });
            this.chartData.push(metricChartDataMultiModel);
        });
        console.log(this.chartData);
    }


    /**
     * format the axis numbers to only display integers
     * @param data
     * @returns {string}
     */
    axisFormat(data) {
        if (data % 1 === 0) {
            return data.toLocaleString();
        } else {
            return '';
        }
    }

}
