import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-epi-curve-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './epi-curve-dashlet.component.html',
    styleUrls: ['./epi-curve-dashlet.component.less']
})
export class EpiCurveDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    chartData: any = [];

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
                    this.caseDataService.getCasesList(this.selectedOutbreak.id).subscribe((cases) => {
                        this.setEpiCurveResults(cases);
                    });
                }
            });
    }

    /**
     * set the data needed for the chart
     * @param cases
     */
    setEpiCurveResults(cases) {
        this.chartData = [];

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
