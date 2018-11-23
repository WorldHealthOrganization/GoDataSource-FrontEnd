import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-contacts-per-case-mean-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-per-case-mean-dashlet.component.html',
    styleUrls: ['./contacts-per-case-mean-dashlet.component.less']
})
export class ContactsPerCaseMeanDashletComponent extends DashletComponent implements OnInit {
    // mean for contacts per case
    meanNoContactsPerCase: number;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        this.displayLoading = true;
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
    }

    /**
     * Refresh data
     */
    refreshData() {
        // get contacts per case mean
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'contactDate',
                null
            );

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('type', EntityType.CASE)
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // retrieve data
            this.displayLoading = true;
            this.relationshipDataService
                .getMetricsOfContactsPerCase(this.outbreakId, qb)
                .subscribe((result) => {
                    this.meanNoContactsPerCase = result.meanNoContactsPerCase;
                    this.displayLoading = false;
                });
        }
    }
}


