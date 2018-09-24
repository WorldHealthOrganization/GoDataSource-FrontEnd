import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-contacts-per-case-median-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-per-case-median-dashlet.component.html',
    styleUrls: ['./contacts-per-case-median-dashlet.component.less']
})
export class ContactsPerCaseMedianDashletComponent extends DashletComponent implements OnInit {

    // median for contacts per case
    medianNoContactsPerCase: number;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // get contacts per case mean
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.relationshipDataService
                        .getMetricsOfContactsPerCase(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.medianNoContactsPerCase = result.medianNoContactsPerCase;
                        });
                }
            });
    }

}


