import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { NgForm } from '@angular/forms';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { PhoneNumberType, UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-modify-user',
  templateUrl: './modify-user.component.html'
})
export class ModifyUserComponent extends ViewModifyComponent implements OnInit {
  breadcrumbs: BreadcrumbItemModel[] = [];

  // constants
  UserModel = UserModel;
  OutbreakModel = OutbreakModel;
  PhoneNumberType = PhoneNumberType;

  // authenticated user
  authUser: UserModel;

  userId: string;
  user: UserModel = new UserModel();
  oldPassword: string;
  passwordConfirmModel: string;
  rolesList$: Observable<UserRoleModel[]>;
  outbreaksList$: Observable<OutbreakModel[]>;
  institutionsList$: Observable<LabelValuePair[]>;

  // ask for old password
  askForOldPassword: boolean = false;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private userDataService: UserDataService,
    private userRoleDataService: UserRoleDataService,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private formHelper: FormHelperService,
    protected dialogService: DialogService,
    private referenceDataService: ReferenceDataDataService,
    private systemSettingsDataService: SystemSettingsDataService
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

    // get the route params
    this.route.params.subscribe((params: {userId}) => {
      // get the ID of the User being modified
      this.userId = params.userId;

      // retrieve user and system information
      forkJoin([
        this.systemSettingsDataService.getAPIVersionNoCache(),
        this.userDataService.getUser(this.userId)
      ]).subscribe(([tokenInfo, user]) => {
        // determine if we should ask for old password
        this.askForOldPassword = !tokenInfo.skipOldPasswordForUserModify;

        // set user data
        this.user = user;

        // update breadcrumbs
        this.initializeBreadcrumbs();

        // hide loading
        this.hideLoadingDialog();
      });
    });

    // get the list of roles to populate the dropdown in UI
    const qb = new RequestQueryBuilder();
    qb.sort.by('name');
    this.rolesList$ = this.userRoleDataService.getRolesList(qb);
    this.outbreaksList$ = this.outbreakDataService.getOutbreaksListReduced();
    this.institutionsList$ = this.referenceDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.INSTITUTION_NAME);
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [];

    // add list breadcrumb only if we have permission
    if (UserModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '/users')
      );
    }

    // view / modify breadcrumb
    this.breadcrumbs.push(
      new BreadcrumbItemModel(
        this.viewOnly ?
          'LNG_PAGE_VIEW_USER_TITLE' :
          'LNG_PAGE_MODIFY_USER_TITLE',
        null,
        true,
        {},
        this.user
      )
    );
  }

  /**
     * Modify user
     */
  modifyUser(form: NgForm) {
    // validate form
    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // remove password if empty
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    if (_.isEmpty(dirtyFields.password)) {
      delete dirtyFields.passwordConfirmModel;
      delete dirtyFields.oldPassword;
    }

    // remove password confirm
    delete dirtyFields.passwordConfirm;

    if (form.valid && !_.isEmpty(dirtyFields)) {
      // show loading
      this.showLoadingDialog();

      // modify the user
      this.userDataService
        .modifyUser(this.userId, dirtyFields)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            // hide loading
            this.hideLoadingDialog();
            return throwError(err);
          })
        )
        .subscribe((modifiedUser: UserModel) => {
          // update model
          this.user = modifiedUser;
          this.oldPassword = undefined;

          // reset password confirm model
          this.passwordConfirmModel = undefined;

          // reload user auth data in case he's changing the active outbreak
          this.authDataService
            .reloadAndPersistAuthUser()
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                // hide loading
                this.hideLoadingDialog();
                return throwError(err);
              })
            )
            .subscribe(() => {
              // mark form as pristine
              form.form.markAsPristine();

              // display message
              this.toastV2Service.success('LNG_PAGE_MODIFY_USER_ACTION_MODIFY_USER_SUCCESS_MESSAGE');

              // update breadcrumbs
              this.initializeBreadcrumbs();

              // hide loading
              this.hideLoadingDialog();
            });
        });
    }
  }
}
