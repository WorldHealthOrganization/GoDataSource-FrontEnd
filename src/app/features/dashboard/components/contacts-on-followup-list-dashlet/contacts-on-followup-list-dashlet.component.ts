import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-contacts-on-followup-list-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-on-followup-list-dashlet.component.html',
    styleUrls: ['./contacts-on-followup-list-dashlet.component.less']
})
export class ContactsOnFollowupListDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of contacts on the followup list
    contactsOnFollowUpListCount: number = 0;

    // constants to be used for applyListFilters
    Constants = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    constructor(
        private followUpDataService: FollowUpsDataService,
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

        // parent subscribers
        this.releaseSubscribers();
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                'address.parentLocationIdFilter'
            );

            // date
            if (this.globalFilterDate) {
                qb.filter
                    .byEquality(
                        'startDate',
                        this.globalFilterDate.startOf('day').toISOString()
                    ).byEquality(
                        'endDate',
                        this.globalFilterDate.endOf('day').toISOString()
                    );
            }

            // change the way we build query
            qb.filter.firstLevelConditions();

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(this.outbreakId, qb)
                .subscribe((result) => {
                    this.contactsOnFollowUpListCount = result.contactsCount;
                    this.displayLoading = false;
                });
        }
    }
}
