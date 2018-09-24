import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-cases-deceased-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-deceased-dashlet.component.html',
    styleUrls: ['./cases-deceased-dashlet.component.less']
})
export class CasesDeceasedDashletComponent extends DashletComponent implements OnInit {

    // number of deceased cases
    casesDeceasedCount: number;
    // constants to be used for applyListFilter
    Constants: any = Constants;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // get number of deceased cases
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


