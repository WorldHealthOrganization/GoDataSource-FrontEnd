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
import { Constants } from '../../../../core/models/constants';


@Component({
    selector: 'app-create-event',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-event.component.html',
    styleUrls: ['./create-event.component.less']
})
export class CreateEventComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Events', '/events'),
        new BreadcrumbItemModel('Create New Event', '.', true)
    ];

    // selected outbreak ID
    outbreakId: string;

    eventData: EventModel = new EventModel();

    Constants = Constants;

    constructor(
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
    }

    ngOnInit() {
        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.outbreakId = selectedOutbreak.id;
            });
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
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.router.navigate(['/events']);
                });
        }
    }
}
