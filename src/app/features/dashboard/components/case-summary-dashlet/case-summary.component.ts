import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

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

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {}

    ngOnInit() {

        this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION).subscribe( (resultCases) => {
            this.caseClassificationsList = resultCases;
        });

        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    // get chain data and convert to array of size and number
                    this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id).subscribe((chains) => {
                        this.setHistogramResults(chains);
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

    /**
     * Handle click on a bar in the chart
     * @param event
     */
    onSelectChart(event) {
        this.selectedSizeOfChains = event.name;
        // TODO open chains of transmission filtered by the size of the chains
    }

}
