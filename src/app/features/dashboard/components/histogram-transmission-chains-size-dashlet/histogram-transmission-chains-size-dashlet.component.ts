import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
    selector: 'app-histogram-transmission-chains-size-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './histogram-transmission-chains-size-dashlet.component.html',
    styleUrls: ['./histogram-transmission-chains-size-dashlet.component.less']
})
export class HistogramTransmissionChainsSizeDashletComponent implements OnInit {

    selectedOutbreak: OutbreakModel;
    chainsSize: any;
    histogramResults: any = [];
    selectedSizeOfChains = 0;

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService,
        private router: Router
    ) {}

    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreakSubject()
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
            if (!_.isEmpty(this.chainsSize) && this.chainsSize[value.size]) {
                this.chainsSize[value.size]++;
            } else {
                this.chainsSize[value.size] = 1;
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
     * Redirect to chains graph
     * @param event
     */
    onSelectChart(event) {
        this.selectedSizeOfChains = event.name;
        this.router.navigate(['/transmission-chains'], {queryParams: { sizeOfChainsFilter: this.selectedSizeOfChains } });
    }

}
