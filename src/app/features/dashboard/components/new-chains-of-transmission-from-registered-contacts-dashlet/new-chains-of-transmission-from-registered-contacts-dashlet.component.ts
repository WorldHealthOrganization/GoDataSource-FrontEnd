import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { Constants } from '../../../../core/models/constants';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';

@Component({
    selector: 'app-new-chains-of-transmission-from-registered-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-chains-of-transmission-from-registered-contacts-dashlet.component.html',
    styleUrls: ['./new-chains-of-transmission-from-registered-contacts-dashlet.component.less']
})
export class NewChainsOfTransmissionFromRegisteredContactsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
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

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    // constants
    TransmissionChainModel = TransmissionChainModel;

    /**
     * Constructor
     */
    constructor(
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        protected listFilterDataService: ListFilterDataService,
        protected authDataService: AuthDataService
    ) {
        super(
            listFilterDataService,
            authDataService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get number of deceased cases
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

    /**
     * Component destroyed
     */
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

        // parent subscribers
        this.releaseSubscribers();
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // date
            if (this.globalFilterDate) {
                qb.filter.byDateRange(
                    'contactDate', {
                        endDate: this.globalFilterDate.endOf('day').format()
                    }
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.addChildQueryBuilder('case').filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // classification
            if (!_.isEmpty(this.globalFilterClassificationId)) {
                // person
                qb.addChildQueryBuilder('case').filter.where({
                    classification: {
                        inq: this.globalFilterClassificationId
                    }
                });
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.transmissionChainDataService
                .getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(this.outbreakId, qb)
                .subscribe((result) => {
                    this.numOfNewChainsOfTransmissionFromRegContactsBecomeCases = result.length;
                    this.displayLoading = false;
                });
        }
    }
}
