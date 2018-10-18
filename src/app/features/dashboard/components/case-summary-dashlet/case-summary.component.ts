import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { CaseDataService } from '../../../../core/services/data/case.data.service';

@Component({
    selector: 'app-case-summary-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-summary.component.html',
    styleUrls: ['./case-summary.component.less']
})
export class CaseSummaryComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    chainsSize: any;
    histogramResults: any = [];
    caseClassificationsList: LabelValuePair[];
    caseSummary: any;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private caseDataService: CaseDataService
    ) {}

    ngOnInit() {

        // get number of hospitalised cases
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for hospitalised cases
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getCasesList(selectedOutbreak.id)
                        .subscribe((casesList) => {

                            _.forEach(casesList, (casePerson, key) => {
                                if ( this.caseSummary[casePerson.classification] ) {
                                    this.caseSummary[casePerson.classification] ++;
                                } else {
                                    this.caseSummary[casePerson.classification] = 1;
                                }
                            });
                            console.log(this.caseSummary);
                        });
                }
            });
    }

    /**
     * set the data needed for the chart
     * @param chains
     */
    setHistogramResults(chains) {
        this.chainsSize = {};
        this.histogramResults = [];
        _.forEach(chains, (value, key) => {
            if (!_.isEmpty(this.chainsSize) && this.chainsSize[value.noCases]) {
                this.chainsSize[value.noCases]++;
            } else {
                this.chainsSize[value.noCases] = 1;
            }
        });
        _.forEach(this.chainsSize, (value, key) => {
            this.histogramResults.push({name: key, value: value});
        });
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
