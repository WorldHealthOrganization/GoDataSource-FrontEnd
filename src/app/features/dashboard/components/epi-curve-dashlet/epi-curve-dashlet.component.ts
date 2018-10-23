import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { CaseModel } from '../../../../core/models/case.model';
import { MetricChartDataMultiModel } from '../../../../core/models/metrics/metric-chart-data-multi.model';
import { MetricCasesCountStratified } from '../../../../core/models/metrics/metric-cases-count-stratified.model';
import { Constants } from '../../../../core/models/constants';
import * as moment from 'moment';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-epi-curve-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './epi-curve-dashlet.component.html',
    styleUrls: ['./epi-curve-dashlet.component.less']
})
export class EpiCurveDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    caseClassificationsList: ReferenceDataEntryModel[];
    chartData: any = [];
    chartData1: any = {};
    casesList: CaseModel[];
    metricData: MetricCasesCountStratified[];
    chartDataCategories: any = [];
    chartDataColumns: any = [];
//
//         ['LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_ACTIVE_CLASSIFICATION',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_DISABLED_CLASSIFICATION',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_NOT_A_CASE_DISCARDED',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_PROBABLE',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_SUSPECT',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_TEST_2',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_TEST_3',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_XML_CLASSIFICATION',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_MI_TEST_ENTRY_16',
//     'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_MI_TEST_ENTRY_15'
// ];

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    // get chain data and convert to array of size and number
                    this.caseDataService.getCasesStratifiedByClassificationOverTime(this.selectedOutbreak.id).subscribe((results) => {
                        this.metricData = results;

                        this.referenceDataDataService
                            .getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
                            .subscribe((caseClassification) => {
                                this.caseClassificationsList = caseClassification.entries;
                                this.chartData1 = this.setEpiCurveResults();
                                const chartDataTemp = [];
                                _.forEach(Object.keys(this.chartData1), (key) => {
                                    chartDataTemp.push(this.chartData1[key]);
                                });
                                this.chartData = chartDataTemp;
                                // this.chartData = [
                                //     ['data1', -30, 200, 200, 400, -150, 250],
                                //     ['data2', 130, 100, -100, 200, -150, 50],
                                //     ['data3', -230, 200, 200, -300, 250, 250]
                                // ];
                                console.log(this.chartData);
                                console.log(this.chartDataColumns);
                                console.log(this.chartDataCategories);
                        });

                    });
                }
            });
    }

    /**
     * set the data needed for the chart
     */
    setEpiCurveResults() {
        const chartData = {};
        _.forEach(this.metricData, (metric, key) => {
            this.chartDataCategories.push(moment(metric.start).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
            _.forEach(Object.keys(metric.classification), (key) => {

                const translatedKey = this.i18nService.instant(key);

                if (chartData[translatedKey]) {
                    chartData[translatedKey].push(metric.classification[key]);
                } else {
                    this.chartDataColumns.push(translatedKey);
                    chartData[translatedKey] = [];
                    chartData[translatedKey].push(translatedKey);
                    chartData[translatedKey].push(metric.classification[key]);
                }
            });
        });
        return chartData;
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
