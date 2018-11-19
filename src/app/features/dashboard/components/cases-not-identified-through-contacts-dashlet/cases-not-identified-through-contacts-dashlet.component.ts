import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
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

    // selected outbreak
    selectedOutbreak;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get contacts on followup list count
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.triggerUpdateValues.call(true);
                }
            });
    }

    /**
     * Handles the call to the API to get the count
     */
    updateValues() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            this.caseDataService
                .getCasesCount(this.selectedOutbreak.id, this.listFilterDataService.filterCasesNotIdentifiedThroughContacts())
                .subscribe((result) => {
                    this.count = result.count;
                });
        }
    }

    /**
     * Refresh data
     */
    refreshData() {}
}


