import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber, Subscription } from 'rxjs';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import * as _ from 'lodash';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CaseModel } from '../../../../core/models/case.model';

@Component({
    selector: 'app-new-cases-previous-days-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './new-cases-previous-days-contacts-dashlet.component.html',
    styleUrls: ['./new-cases-previous-days-contacts-dashlet.component.less']
})
export class NewCasesPreviousDaysContactsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of cases with less than x contacts
    casesAmongContactsCount: number = 0;

    // number of new cases
    newCases: number = 0;

    // x metric set on outbreak
    xDaysAmongContacts: number;

    // constants to be used for applyListFilters
    CaseModel = CaseModel;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    // subscribers
    outbreakSubscriber: Subscription;
    previousSubscriber: Subscription;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }));

    // query params
    queryParams: {
        [key: string]: any
    };

    /**
     * Constructor
     */
    constructor(
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
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
        // get contacts on followup list count
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    // refresh
                    this.outbreakId = selectedOutbreak.id;
                    this.xDaysAmongContacts = selectedOutbreak.noDaysAmongContacts;
                    this.refreshDataCaller.call();

                    // update query params
                    this.updateQueryParams();
                }
            });
    }

    /**
     * Component destroyed
     */
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

        // debounce caller
        if (this.triggerUpdateValues) {
            this.triggerUpdateValues.unsubscribe();
            this.triggerUpdateValues = null;
        }

        // parent subscribers
        this.releaseSubscribers();
    }

    /**
     * Triggers when the value of the no of days is changed in UI
     * @param newXDaysAmongContacts
     */
    onChangeSetting(newXDaysAmongContacts) {
        // update value
        this.xDaysAmongContacts = newXDaysAmongContacts;
        this.triggerUpdateValues.call();

        // update query params
        this.updateQueryParams();
    }

    /**
     * Update query params
     */
    private updateQueryParams(): void {
        this.queryParams = {
            applyListFilter: Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS,
            [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
            x: this.xDaysAmongContacts
        };
    }

    /**
     * Refresh data
     */
    refreshData() {
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                'addresses.parentLocationIdFilter',
                true
            );

            // exclude discarded cases
            qb.filter.where({
                classification: {
                    neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                }
            });

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (this.globalFilterDate) {
                qb.filter.where({
                    dateOfReporting: {
                        lte: moment(this.globalFilterDate).toISOString()
                    }
                });
            }

            // convert
            let noDaysAmongContacts: number = _.isNumber(this.xDaysAmongContacts) || _.isEmpty(this.xDaysAmongContacts) ? this.xDaysAmongContacts : _.parseInt(this.xDaysAmongContacts);
            if (_.isNumber(noDaysAmongContacts)) {
                // add number of days until current day
                if (this.globalFilterDate) {
                    noDaysAmongContacts += moment().endOf('day').diff(moment(this.globalFilterDate).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysAmongContacts',
                    noDaysAmongContacts
                );
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.relationshipDataService
                .getCountIdsOfCasesAmongKnownContacts(this.outbreakId, qb)
                .subscribe((result) => {
                    this.casesAmongContactsCount = result.newCasesAmongKnownContactsCount;
                    this.newCases = result.newCasesCount;
                    this.displayLoading = false;
                });
        }
    }
}


