import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-cases-pending-lab-results-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-pending-lab-results-dashlet.component.html',
    styleUrls: ['./cases-pending-lab-results-dashlet.component.less']
})
export class CasesPendingLabResultsDashletComponent extends DashletComponent implements OnInit {

    // number of cases pending lab result
    casesPendingLabResultCount: number;
    // constants to be used for applyListFilters
    Constants: any = Constants;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // get number of cases pending lab result
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for cases pending lab result
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getCasesPendingLabResultCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.casesPendingLabResultCount = result.count;
                        });
                }
            });
    }

}


