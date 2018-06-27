import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
    selector: 'app-events-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.less']
})
export class EventsListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Events', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing events
    eventsList$: Observable<EventModel[]>;
    eventsListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    // events outbreak
    selectedOutbreak: OutbreakModel;

    constructor(
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
    ) {}

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.loadEventsList();
            });
    }

    /**
     * Re(load) the Events list
     */
    loadEventsList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Events
            this.eventsList$ = this.eventDataService.getEventsList(this.selectedOutbreak.id, this.eventsListQueryBuilder);
        }
    }

    /**
     * Filter Events by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // clear filter ?
        if (_.isEmpty(value)) {
            this.eventsListQueryBuilder.whereRemove(property);
        } else {
            // starts with
            this.eventsListQueryBuilder.where({
                [property]: {
                    regexp: `/^${value}/i`
                }
            });
        }

        // refresh events list
        this.loadEventsList();
    }

    /**
     * Check if we have write access to events
     * @returns {boolean}
     */
    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // allways visible columns
        const columns = ['name', 'date', 'description', 'address'];

        // check if the authenticated user has WRITE access
        if (this.hasEventWriteAccess()) {
            columns.push('actions');
        }

        // finished
        return columns;
    }
}
