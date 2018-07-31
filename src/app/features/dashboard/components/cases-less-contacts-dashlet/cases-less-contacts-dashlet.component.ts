import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-cases-less-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-less-contacts-dashlet.component.html',
    styleUrls: ['./cases-less-contacts-dashlet.component.less']
})
export class CasesLessContactsDashletComponent implements OnInit {

    // number of cases with less than x contacts
    casesLessContactsCount: number;
    // x metric set on outbreak
    xLessContacts: number;
    // constants to be used for applyListFilters
    Constants = Constants;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get contacts on followup list count
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for contacts on the follow up list
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.xLessContacts = selectedOutbreak.noLessContacts;
                    this.relationshipDataService
                        .getCountIdsOfCasesLessThanXContacts(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.casesLessContactsCount = result.casesCount;
                        });
                }
            });
    }

}


