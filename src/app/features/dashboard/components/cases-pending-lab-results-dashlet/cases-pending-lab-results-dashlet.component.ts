import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-cases-pending-lab-results-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-pending-lab-results-dashlet.component.html',
    styleUrls: ['./cases-pending-lab-results-dashlet.component.less']
})
export class CasesPendingLabResultsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of cases pending lab result
    casesPendingLabResultCount: number;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // constants to be used for applyListFilters
    Constants: any = Constants;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of cases pending lab result
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
        // get the results for cases pending lab result
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'dateOfOnset',
                'addresses.parentLocationIdFilter'
            );

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getCasesPendingLabResultCount(this.outbreakId, qb)
                .subscribe((result) => {
                    this.casesPendingLabResultCount = result.count;
                    this.displayLoading = false;
                });
        }
    }
}


