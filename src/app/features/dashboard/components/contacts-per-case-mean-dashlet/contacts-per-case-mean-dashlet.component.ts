import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-contacts-per-case-mean-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-per-case-mean-dashlet.component.html',
    styleUrls: ['./contacts-per-case-mean-dashlet.component.less']
})
export class ContactsPerCaseMeanDashletComponent implements OnInit {

    // mean for contacts per case
    meanNoContactsPerCase: number;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService
    ) {}

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


