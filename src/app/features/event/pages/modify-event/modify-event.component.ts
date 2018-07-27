import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-modify-event',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-event.component.html',
    styleUrls: ['./modify-event.component.less']
})
export class ModifyEventComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Events', '/events')
    ];

    eventId: string;
    outbreakId: string;

    eventData: EventModel = new EventModel();

    // provide constants to template
    EntityType = EntityType;

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private eventDataService: EventDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router
    ) {}

    ngOnInit() {
        this.route.params
            .subscribe((params: {eventId}) => {
                this.eventId = params.eventId;

                // get current outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // get contact
                        this.eventDataService
                            .getEvent(selectedOutbreak.id, this.eventId)
                            .subscribe(eventDataReturned => {
                                this.eventData = new EventModel(eventDataReturned);
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_MODIFY_EVENT_TITLE',
                                        '.',
                                        true,
                                        {},
                                        this.eventData
                                    )
                                );
                            });
                    });
            });
    }

    modifyContact(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the event
        this.eventDataService
            .modifyEvent(this.outbreakId, this.eventId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('Event saved!');

                // navigate to listing page
                this.router.navigate(['/events']);
            });
    }
}
