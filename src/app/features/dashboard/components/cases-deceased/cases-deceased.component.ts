import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';

@Component({
    selector: 'app-cases-deceased',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-deceased.component.html',
    styleUrls: ['./cases-deceased.component.less']
})
export class CasesDeceasedComponent implements OnInit {

    // number of deceased cases
    casesDeceasedCount: number;
    // constants to be used for contactsFilter
    Constants: any = Constants;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get contacts on followup list count
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for contacts on the follow up list
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getDeceasedCasesCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.casesDeceasedCount = result.count;
                        });
                }
            });
    }

}


