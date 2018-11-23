import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { MetricContactsWithSuccessfulFollowUp } from '../../../../core/models/metrics/metric.contacts-with-success-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-contacts-with-successful-follow-ups-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-with-successful-follow-ups-dashlet.component.html',
    styleUrls: ['./contacts-with-successful-follow-ups-dashlet.component.less']
})
export class ContactsWithSuccessfulFollowUpsDashletComponent extends DashletComponent implements OnInit {
    // contacts with successfulFollowup
    contactsWithSuccessfulFollowup: MetricContactsWithSuccessfulFollowUp;

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP
    };

    // loading data
    displayLoading: boolean = false;

    constructor(
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        this.refreshDataCaller.call();
    }

    /**
     * Refresh data
     */
    refreshData() {
        this.displayLoading = true;
        this.listFilterDataService.filterContactsWithSuccessfulFollowup(this.globalFilterDate, this.globalFilterLocationId)
            .subscribe((result: MetricContactsWithSuccessfulFollowUp) => {
                this.contactsWithSuccessfulFollowup = result;
                this.displayLoading = false;
            });
    }
}
