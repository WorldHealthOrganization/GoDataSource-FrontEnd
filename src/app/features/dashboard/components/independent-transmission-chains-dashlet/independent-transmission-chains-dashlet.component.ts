import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';

@Component({
    selector: 'app-independent-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './independent-transmission-chains-dashlet.component.html',
    styleUrls: ['./independent-transmission-chains-dashlet.component.less']
})
export class IndependentTransmissionChainsDashletComponent implements OnInit {

    // number of independent transmission chains
    independentTransmissionChainsCount: number;

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get number of independent transmission chains
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for independent transmission chains
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.transmissionChainDataService
                        .getCountIndependentTransmissionChains(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.independentTransmissionChainsCount = result.length;
                        });
                }
            });
    }

}


