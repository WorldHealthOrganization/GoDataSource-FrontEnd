import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-cases-less-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-less-contacts-dashlet.component.html',
    styleUrls: ['./cases-less-contacts-dashlet.component.less']
})
export class CasesLessContactsDashletComponent extends DashletComponent implements OnInit {

    // number of cases with less than x contacts
    casesLessContactsCount: number;
    // x metric set on outbreak
    xLessContacts: number;
    // constants to be used for applyListFilters
    Constants = Constants;
    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
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
                    this.xLessContacts = selectedOutbreak.noLessContacts;
                    this.triggerUpdateValues.call(true);
                }
            });
    }

    /**
     * Triggers when the value of the no of contacts is changed in UI
     * @param newXLessContacts
     */
    onChangeSetting(newXLessContacts) {
        this.xLessContacts = newXLessContacts;
        this.triggerUpdateValues.call();
    }

    /**
     * Handles the call to the API to get the count
     */
    updateValues() {
        // get the results for contacts not seen
        if (this.selectedOutbreak && this.selectedOutbreak.id) {
            // get the number of days used to filter not seen contacts
            this.relationshipDataService
                .getCountIdsOfCasesLessThanXContacts(this.selectedOutbreak.id, this.xLessContacts)
                .subscribe((result) => {
                    this.casesLessContactsCount = result.casesCount;
                });
        }
    }

}


