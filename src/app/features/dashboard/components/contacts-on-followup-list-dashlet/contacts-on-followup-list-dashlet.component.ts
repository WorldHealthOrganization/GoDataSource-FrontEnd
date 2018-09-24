import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DashletComponent } from '../../helperClasses/dashlet-component';

@Component({
    selector: 'app-contacts-on-followup-list-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-on-followup-list-dashlet.component.html',
    styleUrls: ['./contacts-on-followup-list-dashlet.component.less']
})
export class ContactsOnFollowupListDashletComponent extends DashletComponent implements OnInit {

    // number of contacts on the followup list
    contactsOnFollowUpListCount: number;
    // constants to be used for applyListFilters
    Constants = Constants;

    constructor(
        private followUpDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super();
    }

    ngOnInit() {
        // get contacts on followup list count
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for contacts on the follow up list
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.followUpDataService
                        .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id)
                        .subscribe((result) => {
                            this.contactsOnFollowUpListCount = result.contactsCount;
                        });
                }
            });

    }

}


