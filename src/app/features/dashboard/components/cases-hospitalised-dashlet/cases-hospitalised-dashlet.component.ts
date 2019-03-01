import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs/Subscription';

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
    Constants: any = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

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
        // get the results for hospitalised cases
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
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
                .getHospitalisedCasesCount(this.outbreakId, this.globalFilterDate, qb)
                .subscribe((result) => {
                    this.casesHospitalisedCount = result.count;
                    this.displayLoading = false;
                });
        }
    }
}
