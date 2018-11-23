import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { MetricContactsLostToFollowUpModel } from '../../../../core/models/metrics/metric-contacts-lost-to-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

@Component({
    selector: 'app-contacts-lost-to-follow-up-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-lost-to-follow-up-dashlet.component.html',
    styleUrls: ['./contacts-lost-to-follow-up-dashlet.component.less']
})
export class ContactsLostToFollowUpDashletComponent extends DashletComponent implements OnInit {
    // number of contacts who are lost to follow-up
    noContactsLostToFollowUp: number;

    // provide constants to template
    Constants = Constants;

    // outbreak
    outbreakId: string;

    // loading data
    displayLoading: boolean = false;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of deceased cases
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
        // get the number of contacts who are lost to follow-up
        if (this.outbreakId) {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'date',
                null
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // location
            if (this.globalFilterLocationId) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', this.globalFilterLocationId);
            }

            this.displayLoading = true;
            this.followUpsDataService
                .getNumberOfContactsWhoAreLostToFollowUp(this.outbreakId, qb)
                .subscribe((result: MetricContactsLostToFollowUpModel) => {
                    this.noContactsLostToFollowUp = result.contactsCount;
                    this.displayLoading = false;
                });
        }
    }
}
