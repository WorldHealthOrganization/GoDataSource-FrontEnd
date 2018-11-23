import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MetricIndependentTransmissionChainsModel } from '../../../../core/models/metrics/metric-independent-transmission-chains.model';
import { Constants } from '../../../../core/models/constants';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-number-of-active-chains-of-transmission-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './number-of-active-chains-of-transmission.component.html',
    styleUrls: ['./number-of-active-chains-of-transmission.component.less']
})
export class NumberOfActiveChainsOfTransmissionComponent extends DashletComponent implements OnInit {
    // number of active chains of transmission
    numberOfActiveChains: number;

    // constants to be used for applyListFilter
    Constants: any = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    constructor(
        private transmissionChainDataService: TransmissionChainDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of independent transmission chains
        this.displayLoading = true;
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
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

    /**
     * Refresh data
     */
    refreshData() {
        // get the results for independent transmission chains
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.byEquality(
                    'endDate',
                    this.globalFilterDate.endOf('day').format('YYYY-MM-DD')
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // retrieve data
            this.displayLoading = true;
            this.transmissionChainDataService
                .getCountIndependentTransmissionChains(this.outbreakId, qb)
                .subscribe((result) => {
                    this.numberOfActiveChains = result.activeChainsCount;
                    this.displayLoading = false;
                });
        }
    }
}
