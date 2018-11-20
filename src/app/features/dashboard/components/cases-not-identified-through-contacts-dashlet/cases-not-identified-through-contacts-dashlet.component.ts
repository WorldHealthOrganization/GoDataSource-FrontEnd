import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-cases-not-identified-through-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-not-identified-through-contacts-dashlet.component.html',
    styleUrls: ['./cases-not-identified-through-contacts-dashlet.component.less']
})
export class CasesNotIdentifiedThroughContactsDashletComponent extends DashletComponent implements OnInit {
    // Number of cases who are not identified though known contact list
    count: number = 0;

    // constants to be used for applyListFilters
    Constants = Constants;

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
        // get contacts on followup list count
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
        // get the results for contacts on the follow up list
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'dateOfOnset',
                'addresses.parentLocationIdFilter'
            );

            // merge other conditions
            qb.merge(this.listFilterDataService.filterCasesNotIdentifiedThroughContacts());

            // retrieve data
            this.displayLoading = true;
            this.caseDataService
                .getCasesCount(this.outbreakId, qb)
                .subscribe((result) => {
                    this.count = result.count;
                    this.displayLoading = false;
                });
        }
    }
}


