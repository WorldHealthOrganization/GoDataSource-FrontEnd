import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { CaseModel } from '../../../../core/models/case.model';
import { MetricChartDataMultiModel } from '../../../../core/models/metrics/metric-chart-data-multi.model';
import { MetricChartDataModel } from '../../../../core/models/metrics/metric-chart-data.model';

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
        },

        {
            "name": "France",
            "series": [
                {
                    "name": "2010",
                    "value": 5000002
                },
                {
                    "name": "2011",
                    "value": 5800000
                }
            ]
        },
        {
            "name": "1",
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
            "name": "2",
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
            "name": "3",
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
            "name": "5",
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
            "name": "6",
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
            "name": "10",
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
            "name": "20",
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
            "name": "31",
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
            "name": "41",
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
            "name": "4211",
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
            "name": "2131",
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
            "name": "321321312",
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
            "name": "321321",
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
                    this.caseDataService.getCasesList(this.selectedOutbreak.id).subscribe((cases) => {
                        this.casesList = cases;
                        this.setEpiCurveResults();
                    });
                }
            });
    }

    /**
     * set the data needed for the chart
     */
    setEpiCurveResults() {
        // TODO - add m ultiple values to chart data
        this.chartData = [];
        _.forEach(this.casesList, (caseModel, key) => {
            if (caseModel.dateOfOnset) {
                let dataMultiObject: MetricChartDataMultiModel = _.find(this.chartData, (metric) => {
                    metric.name = caseModel.dateOfOnset;
                });
                if (dataMultiObject) {
                    let dataObject: MetricChartDataModel = _.find(dataMultiObject.series, (metric) => {
                        metric.name = caseModel.classification;
                    });
                    if (dataObject) {
                        dataObject.value++;
                    } else {
                        dataObject = new MetricChartDataModel();
                        dataObject.name = caseModel.classification;
                        dataObject.value = 1;
                        dataMultiObject.series.push(dataObject);
                    }
                } else {
                    dataMultiObject = new MetricChartDataMultiModel();
                    dataMultiObject.name = caseModel.dateOfOnset;
                    dataMultiObject.series = [];
                    const dataObject = new MetricChartDataModel();
                    dataObject.name = caseModel.classification;
                    dataObject.value = 1;
                    dataMultiObject.series.push(dataObject);
                    this.chartData.push(dataMultiObject);
                }
            }
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
