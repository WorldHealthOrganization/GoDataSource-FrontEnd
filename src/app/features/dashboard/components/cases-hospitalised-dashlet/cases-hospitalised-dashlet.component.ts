import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-cases-hospitalised-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-hospitalised-dashlet.component.html',
    styleUrls: ['./cases-hospitalised-dashlet.component.less']
})
export class CasesHospitalisedDashletComponent extends DashletComponent implements OnInit {

    // number of hospitalised cases
    casesHospitalisedCount: number;
    // constants to be used for applyListFilters
    Constants: any = Constants;

    constructor(
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // get number of hospitalised cases
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for hospitalised cases
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.caseDataService
                        .getHospitalisedCasesCount(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.casesHospitalisedCount = result.count;
                        });
                }
            });
    }

}


