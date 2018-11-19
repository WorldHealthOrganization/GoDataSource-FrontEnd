import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../../core/models/constants';
import { MetricContactsLostToFollowUpModel } from '../../../../core/models/metrics/metric-contacts-lost-to-follow-up.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import * as moment from 'moment';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

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
    // filter by day - default - yesterday
    date: string = moment().add(-1, 'days').format('YYYY-MM-DD');

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get the number of contacts who are lost to follow-up
        this.outbreakDataService.getSelectedOutbreak()
            .subscribe((selectedOutbreak) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.followUpsDataService
                        .getNumberOfContactsWhoAreLostToFollowUp(selectedOutbreak.id, this.date)
                        .subscribe((result: MetricContactsLostToFollowUpModel) => {
                            this.noContactsLostToFollowUp = result.contactsCount;
                        });
                }
            });
    }

    /**
     * Refresh data
     */
    refreshData() {}
}
