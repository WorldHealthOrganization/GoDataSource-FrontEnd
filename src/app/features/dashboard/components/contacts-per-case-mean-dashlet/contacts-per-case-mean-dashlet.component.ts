import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-contacts-per-case-mean-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-per-case-mean-dashlet.component.html',
    styleUrls: ['./contacts-per-case-mean-dashlet.component.less']
})
export class ContactsPerCaseMeanDashletComponent extends DashletComponent implements OnInit {

    // mean for contacts per case
    meanNoContactsPerCase: number;

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
                            this.meanNoContactsPerCase = result.meanNoContactsPerCase;
                        });
                }
            });
    }

}


