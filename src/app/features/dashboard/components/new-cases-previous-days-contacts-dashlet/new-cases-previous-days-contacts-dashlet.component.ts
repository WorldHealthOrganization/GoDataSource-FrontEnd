
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-new-cases-previous-days-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-cases-previous-days-contacts-dashlet.component.html',
    styleUrls: ['./new-cases-previous-days-contacts-dashlet.component.less']
})
export class NewCasesPreviousDaysContactsDashletComponent implements OnInit {

    // number of cases with less than x contacts
    casesAmongContactsCount: number;
    // number of new cases
    newCases: number;
    // x metric set on outbreak
    xDaysAmongContacts: number;
    // constants to be used for applyListFilters
    Constants = Constants;
    // selected outbreak
    selectedOutbreak;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get contacts on followup list count
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.xDaysAmongContacts = selectedOutbreak.noDaysAmongContacts;
                    this.updateValues();
                }
            });
    }

    /**
     * Triggers when the value of the no of days is changed in UI
     * @param newXDaysAmongContacts
     */
    onChangeSetting(newXDaysAmongContacts) {
        this.xDaysAmongContacts = newXDaysAmongContacts;
        this.updateValues();
    }

    /**
     * Handles the call to the API to get the count
     *
     */
    updateValues() {
        // get the results for contacts not seen
        if (this.selectedOutbreak && this.selectedOutbreak.id) {
            this.relationshipDataService
                .getCountIdsOfCasesAmongKnownContacts(this.selectedOutbreak.id, this.xDaysAmongContacts)
                .subscribe((result) => {
                    this.casesAmongContactsCount = result.newCasesAmongKnownContactsCount;
                    this.newCases = result.newCasesCount;
                });
        }
    }

}


