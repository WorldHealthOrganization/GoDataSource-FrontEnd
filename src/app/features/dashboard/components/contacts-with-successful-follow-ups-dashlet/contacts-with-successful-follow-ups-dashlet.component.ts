import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { MetricContactsWithSuccessfulFollowUp } from '../../../../core/models/metrics/metric.contacts-with-success-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { Subscription } from 'rxjs';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ContactModel } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-contacts-with-successful-follow-ups-dashlet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './contacts-with-successful-follow-ups-dashlet.component.html',
  styleUrls: ['./contacts-with-successful-follow-ups-dashlet.component.less']
})
export class ContactsWithSuccessfulFollowUpsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
  // contacts with successfulFollowup
  contactsWithSuccessfulFollowup: MetricContactsWithSuccessfulFollowUp;

  // constants
  ContactModel = ContactModel;

  // params
  queryParams: any = {
    applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP,
    [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
  };

  // loading data
  displayLoading: boolean = false;

  // for which date do we display data ?
  dataForDate: Moment = moment();

  // subscribers
  previousSubscriber: Subscription;

  /**
     * Constructor
     */
  constructor(
    protected listFilterDataService: ListFilterDataService,
    protected authDataService: AuthDataService
  ) {
    super(
      listFilterDataService,
      authDataService
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.refreshDataCaller.call();
  }

  /**
     * Component destroyed
     */
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

    // update date
    this.dataForDate = this.globalFilterDate ?
      this.globalFilterDate.clone() :
      moment();

    // retrieve data
    this.displayLoading = true;
    this.previousSubscriber = this.listFilterDataService
      .filterContactsWithSuccessfulFollowup(
        this.globalFilterDate,
        this.globalFilterLocationId,
        this.globalFilterClassificationId
      )
      .subscribe((result: MetricContactsWithSuccessfulFollowUp) => {
        this.contactsWithSuccessfulFollowup = result;
        this.displayLoading = false;
      });
  }
}
