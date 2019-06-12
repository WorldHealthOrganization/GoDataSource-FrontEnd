import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cases-deceased-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-deceased-dashlet.component.html',
    styleUrls: ['./cases-deceased-dashlet.component.less']
})
export class CasesDeceasedDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of deceased cases
    casesDeceasedCount: number;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // constants to be used for applyListFilter
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
        // get the results for contacts on the follow up list
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                'addresses.parentLocationIdFilter'
            );

            // date
            if (this.globalFilterDate) {
                qb.filter.byDateRange(
                    'dateOfOutcome', {
                        endDate: this.globalFilterDate.endOf('day').format()
                    }
                );
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getDeceasedCasesCount(this.outbreakId, qb)
                .subscribe((result) => {
                    this.casesDeceasedCount = result.count;
                    this.displayLoading = false;
                });
        }
    }
}


