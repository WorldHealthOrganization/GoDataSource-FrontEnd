import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';

@Component({
    selector: 'app-cases-refusing-treatment-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-refusing-treatment-dashlet.component.html',
    styleUrls: ['./cases-refusing-treatment-dashlet.component.less']
})
export class CasesRefusingTreatmentDashletComponent implements OnInit {

    // number of cases refusing treatment
    casesRefusingTreatmentCount: number;
    // constants to be used for applyListFilters
    Constants: any = Constants;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

    ngOnInit() {
        // get number of cases refusing treatment
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for cases refusing treatment
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getCasesRefusingTreatmentCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.casesRefusingTreatmentCount = result.count;
                        });
                }
            });
    }

}


