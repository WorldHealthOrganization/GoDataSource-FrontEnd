import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MetricContactsSeenEachDays } from '../../../../core/models/metrics/metric-contacts-seen-each-days.model';
import { Constants } from '../../../../core/models/constants';
import { Subscriber } from 'rxjs/Subscriber';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-contacts-seen-each-day-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-seen-each-day-dashlet.component.html',
    styleUrls: ['./contacts-seen-each-day-dashlet.component.less']
})
export class ContactsSeenEachDayDashletComponent implements OnInit {

    // number of contacts seen each day
    contactsSeenEachDay: number;

    // filter by date
    date;

    // selected outbreak
    selectedOutbreakId: string;

    queryParams: any = {
        applyListFilter: Constants.APPLY_LIST_FILTER.CONTACTS_SEEN
    };

    // constants to be used for applyListFilter
    Constants: any = Constants;

    // refresh only after we finish changing data
    private triggerUpdateValues = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.updateValues();
    }));

    constructor(
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private listFilterDataService: ListFilterDataService) {
    }

    ngOnInit() {
        // get the number of cases seen each day
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    this.selectedOutbreakId = selectedOutbreak.id;
                    this.contactDataService
                        .getNumberOfContactsSeenEachDay(selectedOutbreak.id)
                        .subscribe((result: MetricContactsSeenEachDays) => {
                            console.log(result);
                            this.contactsSeenEachDay = result.contactsSeenCount;
                        });
                }
            });
    }

    onDateChanged(date) {
        this.date = date;

        this.queryParams.date = JSON.stringify(date);

        // update
        this.triggerUpdateValues.call();
    }

    updateValues () {
        // get the results for contacts seen
        const qb = this.listFilterDataService.filterContactsSeen(this.date);

        this.contactDataService.getNumberOfContactsSeenEachDay(this.selectedOutbreakId, qb)
            .subscribe((result) => {
                console.log(result);
            });
    }
}
