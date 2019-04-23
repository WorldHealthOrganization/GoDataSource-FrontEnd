import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-independent-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './independent-transmission-chains-dashlet.component.html',
    styleUrls: ['./independent-transmission-chains-dashlet.component.less']
})
export class IndependentTransmissionChainsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of independent transmission chains
    independentTransmissionChainsCount: number;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

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
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }
    }

    /**
     * Refresh data
     */
    refreshData() {
        // get the results for independent transmission chains
        if (this.outbreakId) {
            // configure
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.byEquality(
                    'endDate',
                    this.globalFilterDate.format('YYYY-MM-DD')
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.addChildQueryBuilder('person').filter.byEquality(
                    'addresses.parentLocationIdFilter',
                    this.globalFilterLocationId
                );
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.transmissionChainDataService
                .getCountIndependentTransmissionChains(this.outbreakId, qb)
                .subscribe((result) => {
                    this.independentTransmissionChainsCount = result.length;
                    this.displayLoading = false;
                });
        }
    }
}


