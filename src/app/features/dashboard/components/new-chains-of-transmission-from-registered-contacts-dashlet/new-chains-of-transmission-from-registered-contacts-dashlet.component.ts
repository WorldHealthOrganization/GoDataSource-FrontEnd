import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { Constants } from '../../../../core/models/constants';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-new-chains-of-transmission-from-registered-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-chains-of-transmission-from-registered-contacts-dashlet.component.html',
    styleUrls: ['./new-chains-of-transmission-from-registered-contacts-dashlet.component.less']
})
export class NewChainsOfTransmissionFromRegisteredContactsDashletComponent extends DashletComponent implements OnInit {

    // number of new chains of transmission from registered contacts who became cases
    numOfNewChainsOfTransmissionFromRegContactsBecomeCases: number;

    // query params
    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES
    };

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
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

    /**
     * Refresh data
     */
    refreshData() {}
}
