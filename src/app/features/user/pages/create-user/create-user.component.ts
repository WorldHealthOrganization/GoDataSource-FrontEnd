import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { NgForm } from '@angular/forms';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { PhoneNumberType, UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { catchError } from 'rxjs/operators';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html'
})
export class CreateUserComponent
  extends CreateConfirmOnChanges
  implements OnInit {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [];

  // constants
  OutbreakModel = OutbreakModel;
  PhoneNumberType = PhoneNumberType;

  // authenticated user
  authUser: UserModel;

  newUser: UserModel = new UserModel();
  passwordConfirmModel: string;
  rolesList$: Observable<UserRoleModel[]>;
  outbreaksList$: Observable<OutbreakModel[]>;
  institutionsList$: Observable<LabelValuePair[]>;

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private userRoleDataService: UserRoleDataService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    private outbreakDataService: OutbreakDataService,
    private formHelper: FormHelperService,
    private dialogService: DialogService,
    private referenceDataService: ReferenceDataDataService,
    private redirectService: RedirectService
  ) {
    super();
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the list of roles to populate the dropdown in UI
    const qb = new RequestQueryBuilder();
    qb.sort.by('name');
    this.rolesList$ = this.userRoleDataService.getRolesList(qb);

    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.outbreaksList$ = this.outbreakDataService.getOutbreaksListReduced();

    this.institutionsList$ = this.referenceDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.INSTITUTION_NAME);

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
    if (UserModel.canList(this.authUser)) {
      this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '/users'));
    }

    // create breadcrumb
    this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_USER_TITLE', '.', true));
  }

  /**
     * Create new user
     */
  createNewUser(form: NgForm) {
    const dirtyFields: any = this.formHelper.getDirtyFields(form);

    // remove password confirm
    if (dirtyFields.passwordConfirm) {
      delete dirtyFields.passwordConfirm;
    }

    if (form.valid && !_.isEmpty(dirtyFields)) {
      // modify the user
      const loadingDialog = this.dialogService.showLoadingDialog();

      // try to authenticate the user
      this.userDataService
        .createUser(dirtyFields)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            loadingDialog.close();
            return throwError(err);
          })
        )
        .subscribe((newUser: UserModel) => {
          this.toastV2Service.success('LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_SUCCESS_MESSAGE');

          // hide dialog
          loadingDialog.close();

          // navigate to proper page
          // method handles disableDirtyConfirm too...
          this.redirectToProperPageAfterCreate(
            this.router,
            this.redirectService,
            this.authUser,
            UserModel,
            'users',
            newUser.id
          );
        });
    }
  }
}
