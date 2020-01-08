import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import * as _ from 'lodash';
import { AddressType } from '../../../../core/models/address.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';

@Component({
    selector: 'app-create-event',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-event.component.html',
    styleUrls: ['./create-event.component.less']
})
export class CreateEventComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak ID
    outbreakId: string;

    eventData: EventModel = new EventModel();

    serverToday: Moment = moment();

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.outbreakId = selectedOutbreak.id;
            });

        // pre-set the initial address as "current address"
        this.eventData.address.typeId = AddressType.CURRENT_ADDRESS;

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (EventModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_EVENT_TITLE', '.', true));
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
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.eventDataService
                .createEvent(this.outbreakId, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newEvent: EventModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    // method handles disableDirtyConfirm too...
                    this.redirectToProperPageAfterCreate(
                        this.router,
                        this.redirectService,
                        this.authUser,
                        EventModel,
                        'events',
                        newEvent.id
                    );
                });
        }
    }
}
