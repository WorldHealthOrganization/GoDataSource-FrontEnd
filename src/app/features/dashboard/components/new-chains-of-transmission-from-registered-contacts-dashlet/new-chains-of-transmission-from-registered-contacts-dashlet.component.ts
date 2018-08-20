import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';

@Component({
    selector: 'app-new-chains-of-transmission-from-registered-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-chains-of-transmission-from-registered-contacts-dashlet.component.html',
    styleUrls: ['./new-chains-of-transmission-from-registered-contacts-dashlet.component.less']
})
export class NewChainsOfTransmissionFromRegisteredContactsDashletComponent implements OnInit {

    // number of new chains of transmission from registered contacts who became cases
    numOfNewChainsOfTransmissionFromRegContactsBecomeCases: number;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService) {
    }

    ngOnInit() {
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.transmissionChainDataService.getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.numOfNewChainsOfTransmissionFromRegContactsBecomeCases = result.length;
                        });
                }
            });
    }

}
