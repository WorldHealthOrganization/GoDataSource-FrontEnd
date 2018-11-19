import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { DashletComponent } from '../../helperClasses/dashlet-component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-contacts-not-seen-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-not-seen-dashlet.component.html',
    styleUrls: ['./contacts-not-seen-dashlet.component.less']
})
export class ContactsNotSeenDashletComponent extends DashletComponent implements OnInit {

    // number of days defined on outbreak (x)
    xDaysNotSeen: number;
    // number of contacts not seen in x days
    contactsNotSeenCount: number;
    // constants to be used for applyListFilters
    Constants: any = Constants;
    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));


    constructor(
        private followUpDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService);
    }

    ngOnInit() {
        // get number of not seen contacts
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // get the results for contacts not seen
                if (selectedOutbreak) {
                    this.selectedOutbreak = selectedOutbreak;
                    this.xDaysNotSeen = selectedOutbreak.noDaysNotSeen;
                    this.triggerUpdateValues.call(true);
                }
            });
    }

    /**
     * Triggers when the value of the no of days not seen is changed in UI
     * @param newXDaysNotSeen
     */
    onChangeSetting(newXDaysNotSeen) {
        this.xDaysNotSeen = newXDaysNotSeen;
        // get number of not seen contacts
        this.triggerUpdateValues.call();
    }

    /**
     * Handles the call to the API to get the count
     */
    updateValues() {
        // get the results for contacts not seen
        if (this.selectedOutbreak && this.selectedOutbreak.id) {
            this.followUpDataService
                .getCountIdsOfContactsNotSeen(this.selectedOutbreak.id, this.xDaysNotSeen)
                .subscribe((result) => {
                    this.contactsNotSeenCount = result.contactsCount;
                });
        }
    }

    /**
     * Refresh data
     */
    refreshData() {}
}


