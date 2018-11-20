import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-contacts-become-cases-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-become-cases-dashlet.component.html',
    styleUrls: ['./contacts-become-cases-dashlet.component.less']
})
export class ContactsBecomeCasesDashletComponent extends DashletComponent implements OnInit {
    // number of contacts become cases over time and place
    contactsBecomeCasesCount: number;

    // number of cases ( total )
    casesCount: number;

    // params
    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES
    };

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
                    this.refreshDataCaller.call();
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
                'dateBecomeCase',
                'addresses.parentLocationIdFilter'
            );

            // do we need to include default condition ?
            if (!qb.filter.has('dateBecomeCase')) {
                // any date
                qb.filter.where({
                    'dateBecomeCase': {
                        neq: null
                    }
                });
            }

            // retrieve data
            this.displayLoading = true;
            Observable.forkJoin([
                this.caseDataService.getCasesCount(this.outbreakId, qb),
                this.caseDataService.getCasesCount(this.outbreakId)
            ]).subscribe(([qbCountResult, countResult]) => {
                this.contactsBecomeCasesCount = qbCountResult.count;
                this.casesCount = countResult.count;
                this.displayLoading = false;
            });
        }
    }
}
