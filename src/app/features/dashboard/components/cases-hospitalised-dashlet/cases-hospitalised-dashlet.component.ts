import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-cases-hospitalised-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalised-dashlet.component.html',
    styleUrls: ['./cases-hospitalised-dashlet.component.less']
})
export class CasesHospitalisedDashletComponent extends DashletComponent implements OnInit {

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

    ngOnInit() {
        // get number of hospitalised cases
        this.displayLoading = true;
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call(false);
                }
            });
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

            // retrieve data
            this.displayLoading = true;
            this.caseDataService
                .getHospitalisedCasesCount(this.outbreakId, this.globalFilterDate, qb)
                .subscribe((result) => {
                    this.casesHospitalisedCount = result.count;
                    this.displayLoading = false;
                });
        }
    }
}
