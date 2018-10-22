import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-new-cases-previous-days-transmission-chains-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-cases-previous-days-transmission-chains-dashlet.component.html',
    styleUrls: ['./new-cases-previous-days-transmission-chains-dashlet.component.less']
})
export class NewCasesPreviousDaysTransmissionChainsDashletComponent extends DashletComponent implements OnInit {

    // number of cases in previous x days in known transmission chains
    casesKnownTransmissionChainsCount: number = 0;
    // nr of new cases
    totalCases: number = 0;
    // x metric set on outbreak
    xPreviousDays: number;
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
        // get number of cases in previous x days in known transmission chains
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.xPreviousDays = selectedOutbreak.noDaysInChains;
                    this.triggerUpdateValues.call(true);
                }
            });
    }

    /**
     * Triggers when the value of the no of days is changed in UI
     * @param newXPreviousDays
     */
    onChangeSetting(newXPreviousDays) {
        this.xPreviousDays = newXPreviousDays;
        // get number of cases in previous x days in known transmission chains
        this.triggerUpdateValues.call();
    }

    /**
     * Handles the call to the API to get the count
     */
    updateValues() {
        // get the results for cases in previous x days in known transmission chains
        if (this.selectedOutbreak && this.selectedOutbreak.id) {
            this.relationshipDataService
                .getCountOfCasesInKnownTransmissionChains(this.selectedOutbreak.id, this.xPreviousDays)
                .subscribe((result) => {
                    this.casesKnownTransmissionChainsCount = result.newCases;
                    this.totalCases = result.total;
                });
        }
    }

    /**
     * Calculate percentage of new cases in transmission chains
     * @returns {number}
     */
    percentageCases() {
        return this.totalCases ?
            Math.round(this.casesKnownTransmissionChainsCount / this.totalCases * 100) :
            0;
    }

}


