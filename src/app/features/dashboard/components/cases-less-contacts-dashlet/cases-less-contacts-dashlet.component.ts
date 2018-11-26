import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import * as _ from 'lodash';
import { EntityType } from '../../../../core/models/entity-type';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-cases-less-contacts-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-less-contacts-dashlet.component.html',
    styleUrls: ['./cases-less-contacts-dashlet.component.less']
})
export class CasesLessContactsDashletComponent extends DashletComponent implements OnInit, OnDestroy {
    // number of cases with less than x contacts
    casesLessContactsCount: number;

    // x metric set on outbreak
    xLessContacts: number;

    // constants
    Constants = Constants;

    // selected outbreak
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
        // get contacts on followup list count
        this.displayLoading = true;
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak) {
                    this.outbreakId = selectedOutbreak.id;
                    this.xLessContacts = selectedOutbreak.noLessContacts;
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
     * Triggers when the value of the no of contacts is changed in UI
     * @param newXLessContacts
     */
    onChangeSetting(newXLessContacts) {
        this.xLessContacts = newXLessContacts;
        this.refreshDataCaller.call();
    }

    /**
     * Refresh data
     */
    refreshData() {
        // get the results for contacts not seen
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'contactDate',
                null
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // location
            if (this.globalFilterLocationId) {
                qb.include('people').queryBuilder.filter
                    .byEquality('type', EntityType.CONTACT)
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            // convert noLessContacts to number as the API expects
            const noLessContacts: number = _.isNumber(this.xLessContacts) || _.isEmpty(this.xLessContacts) ? this.xLessContacts  : _.parseInt(this.xLessContacts);
            if (_.isNumber(noLessContacts)) {
                // create filter for daysNotSeen
                qb.filter.byEquality(
                    'noLessContacts',
                    noLessContacts
                );
            }

            // release previous subscriber
            if (this.previousSubscriber) {
                this.previousSubscriber.unsubscribe();
                this.previousSubscriber = null;
            }

            // get the number of days used to filter not seen contacts
            this.displayLoading = true;
            this.previousSubscriber = this.relationshipDataService
                .getCountIdsOfCasesLessThanXContacts(this.outbreakId, qb)
                .subscribe((result) => {
                    this.casesLessContactsCount = result.casesCount;
                    this.displayLoading = false;
                });
        }
    }
}


