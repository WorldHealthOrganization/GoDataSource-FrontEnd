import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-contacts-per-case-median-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-per-case-median-dashlet.component.html',
    styleUrls: ['./contacts-per-case-median-dashlet.component.less']
})
export class ContactsPerCaseMedianDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // median for contacts per case
    medianNoContactsPerCase: number;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.refreshDataCaller.call();
                }
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }
    }

    /**
     * Refresh data
     */
    refreshData() {
        // get contacts per case median
        if (this.outbreakId) {
            // add global filters
            const qb = new RequestQueryBuilder();

            // date
            if (this.globalFilterDate) {
                qb.filter.byDateRange(
                    'contactDate', {
                        endDate: this.globalFilterDate.endOf('day').format()
                    }
                );
            }

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.relationshipDataService
                .getMetricsOfContactsPerCase(this.outbreakId, qb)
                .subscribe((result) => {
                    this.medianNoContactsPerCase = result.medianNoContactsPerCase;
                    this.displayLoading = false;
                });
        }
    }
}


