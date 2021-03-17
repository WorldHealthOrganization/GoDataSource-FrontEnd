import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';
import { CaseModel } from '../../../../core/models/case.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-cases-hospitalised-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalised-dashlet.component.html',
    styleUrls: ['./cases-hospitalised-dashlet.component.less']
})
export class CasesHospitalisedDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of hospitalised cases
    casesHospitalisedCount: number;

    // constants to be used for applyListFilters
    CaseModel = CaseModel;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // query params
    queryParams: {
        [key: string]: any
    } = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED,
        [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
    };

    /**
     * Constructor
     */
    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService,
        protected authDataService: AuthDataService
    ) {
        super(
            listFilterDataService,
            authDataService
        );
    }

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    /**
     * Component initialized
     */
    ngOnInit() {
        // get number of hospitalised cases
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
        // get the results for hospitalised cases
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                'addresses.parentLocationIdFilter',
                true
            );

            // exclude discarded cases
            qb.filter.where({
                classification: {
                    neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                }
            });

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getHospitalisedCasesCount(this.outbreakId, this.globalFilterDate, qb)
                .subscribe((result) => {
                    this.casesHospitalisedCount = result.count;
                    this.displayLoading = false;
                });
        }
    }
}
