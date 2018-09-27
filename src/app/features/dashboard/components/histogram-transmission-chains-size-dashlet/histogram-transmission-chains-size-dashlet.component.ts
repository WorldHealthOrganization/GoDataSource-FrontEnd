import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';

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
    activeSelectedBar:any = {};

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get the number of active chains
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreak = selectedOutbreak;
                    // get chain data and convert to graph nodes
                    this.transmissionChainDataService.getIndependentTransmissionChainData(this.selectedOutbreak.id).subscribe((chains) => {
                        this.setHistogramResults(chains);

                    });
                }
            });
    }

    setHistogramResults(chains) {
        this.chainsSize = {};
        this.histogramResults = [];

        _.forEach(chains, (value, key) => {
            if ( !_.isEmpty(this.chainsSize) && this.chainsSize[value.noCases] ) {
                this.chainsSize[value.noCases] ++;
            } else {
                this.chainsSize[value.noCases] = 1;
            }
        });

        _.forEach(this.chainsSize, (value, key) => {
            this.histogramResults.push( { name: key, value: value } );
        });
    }

    axisFormat(data) {
        if (data % 1 === 0) {
            return data.toLocaleString();
        } else {
            return '';
        }
    }

    onSelectChart(event) {
        this.activeSelectedBar = event;
        console.log(this.activeSelectedBar);
        this.selectedSizeOfChains = event.name;
    }

    resetChainsSelection() {
        this.activeSelectedBar = {};
        this.selectedSizeOfChains = 0;
    }
}
