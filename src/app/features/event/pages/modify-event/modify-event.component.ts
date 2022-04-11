import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { EventModel } from '../../../../core/models/event.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import {
  catchError,
  share
} from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-modify-event',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './modify-event.component.html',
  styleUrls: ['./modify-event.component.less']
})
export class ModifyEventComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [];

  userList$: Observable<UserModel[]>;

  // authenticated user
  authUser: UserModel;
  EventModel = EventModel;
  ContactModel = ContactModel;
  RelationshipModel = RelationshipModel;
  UserModel = UserModel;

  eventId: string;
  outbreakId: string;

  eventData: EventModel = new EventModel();

  // provide constants to template
  EntityType = EntityType;

  serverToday: Moment = moment();

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    private eventDataService: EventDataService,
    private formHelper: FormHelperService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    protected dialogService: DialogService,
    private userDataService: UserDataService
  ) {
    super(
      route,
      dialogService
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // show loading
    this.showLoadingDialog(false);

    // get users only if we're allowed to
    if (UserModel.canList(this.authUser)) {
      this.userList$ = this.userDataService.getUsersListSorted().pipe(share());
    }

    this.route.params
      .subscribe((params: { eventId }) => {
        this.eventId = params.eventId;

        // get current outbreak
        this.outbreakDataService
          .getSelectedOutbreak()
          .subscribe((selectedOutbreak: OutbreakModel) => {
            this.outbreakId = selectedOutbreak.id;

            // get contact
            this.eventDataService
              .getEvent(selectedOutbreak.id, this.eventId, true)
              .subscribe(eventDataReturned => {
                this.eventData = new EventModel(eventDataReturned);

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
              });
          });
      });
  }

  /**
     * Modify event
     */
  modifyEvent(form: NgForm) {
    const dirtyFields: any = this.formHelper.getDirtyFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // show loading
    this.showLoadingDialog();

    // modify the event
    this.eventDataService
      .modifyEvent(
        this.outbreakId,
        this.eventId,
        dirtyFields,
        true
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          // hide loading
          this.hideLoadingDialog();
          return throwError(err);
        })
      )
      .subscribe((modifiedEvent: EventModel) => {
        // update model
        this.eventData = modifiedEvent;

        // mark form as pristine
        form.form.markAsPristine();

        // display message
        this.toastV2Service.success('LNG_PAGE_MODIFY_EVENT_ACTION_MODIFY_EVENT_SUCCESS_MESSAGE');

        // update breadcrumb
        this.initializeBreadcrumbs();

        // hide loading
        this.hideLoadingDialog();
      });
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [];

    // add list breadcrumb only if we have permission
    if (EventModel.canList(this.authUser)) {
      this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'));
    }

    // view / modify breadcrumb
    this.breadcrumbs.push(new BreadcrumbItemModel(
      this.viewOnly ?
        'LNG_PAGE_VIEW_EVENT_TITLE' :
        'LNG_PAGE_MODIFY_EVENT_TITLE',
      '.',
      true,
      {},
      this.eventData
    ));
  }
}
