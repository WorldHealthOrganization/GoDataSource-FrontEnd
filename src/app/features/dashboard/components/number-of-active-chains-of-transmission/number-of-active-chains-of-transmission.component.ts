import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MetricIndependentTransmissionChainsModel } from '../../../../core/models/metrics/metric-independent-transmission-chains.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-number-of-active-chains-of-transmission-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './number-of-active-chains-of-transmission.component.html',
    styleUrls: ['./number-of-active-chains-of-transmission.component.less']
})
export class NumberOfActiveChainsOfTransmissionComponent implements OnInit {

    // number of active chains of transmission
    numberOfActiveChains: number;

    // constants to be used for applyListFilter
    Constants: any = Constants;

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService) {
    }

    ngOnInit() {
        // get the number of active chains
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.transmissionChainDataService
                        .getCountIndependentTransmissionChains(selectedOutbreak.id)
                        .subscribe((result: MetricIndependentTransmissionChainsModel) => {
                            this.numberOfActiveChains = result.activeChainsCount;
                        });
                }
            });
    }
}