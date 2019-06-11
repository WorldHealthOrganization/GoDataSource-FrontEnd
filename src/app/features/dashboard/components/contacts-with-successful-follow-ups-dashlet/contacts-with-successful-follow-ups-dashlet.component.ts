import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { MetricContactsWithSuccessfulFollowUp } from '../../../../core/models/metrics/metric.contacts-with-success-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-contacts-with-successful-follow-ups-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-with-successful-follow-ups-dashlet.component.html',
    styleUrls: ['./contacts-with-successful-follow-ups-dashlet.component.less']
})
export class ContactsWithSuccessfulFollowUpsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // contacts with successfulFollowup
    contactsWithSuccessfulFollowup: MetricContactsWithSuccessfulFollowUp;

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP
    };

    // loading data
    displayLoading: boolean = false;

    // subscribers
    previousSubscriber: Subscription;

    constructor(
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        this.refreshDataCaller.call();
    }

    ngOnDestroy() {
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
        // release previous subscriber
        if (this.previousSubscriber) {
            this.previousSubscriber.unsubscribe();
            this.previousSubscriber = null;
        }

        this.displayLoading = true;
        this.previousSubscriber = this.listFilterDataService.filterContactsWithSuccessfulFollowup(this.globalFilterDate, this.globalFilterLocationId)
            .subscribe((result: MetricContactsWithSuccessfulFollowUp) => {
                this.contactsWithSuccessfulFollowup = result;
                this.displayLoading = false;
            });
    }
}
