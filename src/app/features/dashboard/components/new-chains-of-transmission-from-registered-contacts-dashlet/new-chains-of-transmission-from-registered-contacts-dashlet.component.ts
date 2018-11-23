import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { Constants } from '../../../../core/models/constants';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EntityType } from '../../../../core/models/entity-type';

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

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of deceased cases
        this.displayLoading = true;
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'contactDate',
                null
            );

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('type', EntityType.CASE)
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // retrieve data
            this.displayLoading = true;
            this.transmissionChainDataService
                .getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(this.outbreakId, qb)
                .subscribe((result) => {
                    this.numOfNewChainsOfTransmissionFromRegContactsBecomeCases = result.length;
                    this.displayLoading = false;
                });
        }
    }
}
