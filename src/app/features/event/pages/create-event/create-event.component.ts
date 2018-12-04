import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { AddressType } from '../../../../core/models/address.model';

@Component({
    selector: 'app-create-event',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-event.component.html',
    styleUrls: ['./create-event.component.less']
})
export class CreateEventComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_EVENT_TITLE', '.', true)
    ];

    // selected outbreak ID
    outbreakId: string;

    eventData: EventModel = new EventModel();

    serverToday: Moment = null;

    constructor(
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private genericDataService: GenericDataService
    ) {
        super();
    }

    ngOnInit() {
        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.outbreakId = selectedOutbreak.id;
            });
        // pre-set the initial address as "current address"
        this.eventData.address.typeId = AddressType.CURRENT_ADDRESS;
    }

    /**
     * Create Event
     * @param {NgForm[]} stepForms
     */
    createNewEvent(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Event
            this.eventDataService
                .createEvent(this.outbreakId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe((newEvent: EventModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/events/${newEvent.id}/modify`]);
                });
        }
    }
}
