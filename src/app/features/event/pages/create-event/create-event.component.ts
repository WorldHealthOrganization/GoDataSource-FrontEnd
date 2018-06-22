import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import * as _ from 'lodash';


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

    eventData: EventModel = new EventModel();

    constructor(
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {}

    ngOnInit() {
        // start with one address already initialized
        this.eventData.addresses.push(new AddressModel());
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
            // get selected outbreak
            const dirtyFieldsMap = _.pickBy(new EventModel(dirtyFields), p => p !== undefined);
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // add the new Event
                    this.eventDataService
                        .createEvent(selectedOutbreak.id, dirtyFieldsMap)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('Event added!');

                            // navigate to listing page
                            this.router.navigate(['/events']);
                        });
                });
        }
    }
}
