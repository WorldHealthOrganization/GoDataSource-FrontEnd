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
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Moment } from 'moment';

@Component({
    selector: 'app-modify-event',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-event.component.html',
    styleUrls: ['./modify-event.component.less']
})
export class ModifyEventComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    eventId: string;
    outbreakId: string;

    eventData: EventModel = new EventModel();

    // provide constants to template
    EntityType = EntityType;

    serverToday: Moment = null;

    constructor(
        protected route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private eventDataService: EventDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

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
                                this.createBreadcrumbs();
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
            .subscribe((modifiedEvent: EventModel) => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_EVENT_ACTION_MODIFY_EVENT_SUCCESS_MESSAGE');

                this.eventData = new EventModel(modifiedEvent);
                // update breadcrumbs
                this.createBreadcrumbs();
            });
    }

    /**
     * Check if we have write access to events
     * @returns {boolean}
     */
    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_EVENT_TITLE' : 'LNG_PAGE_MODIFY_EVENT_TITLE',
                '.',
                true,
                {},
                this.eventData
            )
        );
    }
}
