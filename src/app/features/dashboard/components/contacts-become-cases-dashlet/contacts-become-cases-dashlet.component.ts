import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DateRangeModel } from '../../../../core/models/date-range.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import * as _ from 'lodash';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

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

    // filter by Date Range
    dateRange: DateRangeModel;

    // filter by Locations
    locationIds: string[];

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES
    };

    // selected outbreak
    selectedOutbreak;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private listFilterDataService: ListFilterDataService
    ) {
        super();
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

    onDateRangeChange(dateRange: DateRangeModel) {
        this.dateRange = dateRange;

        // update query params
        if (
            _.isEmpty(dateRange) || (
                _.isEmpty(dateRange.startDate) &&
                _.isEmpty(dateRange.endDate)
            )
        ) {
            delete this.queryParams.dateRange;
        } else {
            this.queryParams.dateRange = JSON.stringify(dateRange);
        }

        // update
        this.triggerUpdateValues.call();
    }

    onLocationChange(locationIds: string[]) {
        this.locationIds = locationIds;

        // update query params
        this.queryParams.locationIds = locationIds;

        // update
        this.triggerUpdateValues.call();
    }

    /**
     * Handles the call to the API to get the count
     */
    updateValues() {
        // get the results for contacts not seen
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            const qb = this.listFilterDataService.filterCasesFromContactsOvertimeAndPlace(
                this.dateRange,
                this.locationIds
            );

            this.caseDataService
                .getCasesCount(this.selectedOutbreak.id, qb)
                .subscribe((result) => {
                    this.contactsBecomeCasesCount = result.count;
                });

            this.caseDataService
                .getCasesCount(this.selectedOutbreak.id)
                .subscribe((result) => {
                    this.casesCount = result.count;
                });
        }
    }

}
