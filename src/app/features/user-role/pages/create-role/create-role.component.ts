import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { Observable, throwError } from 'rxjs';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { catchError, share } from 'rxjs/operators';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { FormSelectGroupsComponent, IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
import { IPermissionChildModel, PermissionModel } from '../../../../core/models/permission.model';
import { DomSanitizer } from '@angular/platform-browser';
import { UserRoleHelper } from '../../../../core/helperClasses/user-role.helper';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-role',
  templateUrl: './create-role.component.html'
})
export class CreateRoleComponent
  extends CreateConfirmOnChanges
  implements OnInit {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [];

  // constants
  PermissionModel = PermissionModel;

  // authenticated user
  authUser: UserModel;

  newUserRole: UserRoleModel = new UserRoleModel();
  availablePermissions$: Observable<any[]>;

  // handle select permission group
  @ViewChild('selectedPermissions', { static: true }) selectedPermissions: FormSelectGroupsComponent;

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private userRoleDataService: UserRoleDataService,
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
    private dialogService: DialogService,
    private sanitized: DomSanitizer,
    private i18nService: I18nService,
    private authDataService: AuthDataService,
    private redirectService: RedirectService,
    private route: ActivatedRoute
  ) {
    super();
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // get the list of permissions to populate the dropdown in UI
    this.availablePermissions$ = this.userRoleDataService
      .getAvailablePermissions()
      .pipe(share());

    // do we need to retrieve and clone user role ?
    this.route.queryParams
      .subscribe((queryParams: { cloneId }) => {
        if (
          queryParams &&
                    queryParams.cloneId
        ) {
          setTimeout(() => {
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.userRoleDataService
              .getRole(queryParams.cloneId)
              .pipe(catchError((err) => {
                this.toastV2Service.error(err);

                // hide loading
                loadingDialog.close();

                this.disableDirtyConfirm();
                this.router.navigate(['/']);

                return throwError(err);
              }))
              .subscribe((role) => {
                // remove name
                role.name = '';

                // update data
                this.newUserRole = new UserRoleModel(role);
                if (this.selectedPermissions) {
                  this.selectedPermissions.control.markAsDirty();
                }

                // hide loading
                loadingDialog.close();
              });
          });
        }
      });

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
    if (UserRoleModel.canList(this.authUser)) {
      this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_USER_ROLES_TITLE', '/user-roles'));
    }

    // create breadcrumb
    this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_USER_ROLE_TITLE', '.', true));
  }

  /**
     * Create new role
     */
  createNewRole(form: NgForm) {
    // get dirty fields & validate form
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // modify the user
    const loadingDialog = this.dialogService.showLoadingDialog();

    // try to authenticate the user
    this.userRoleDataService
      .createRole(dirtyFields)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          loadingDialog.close();
          return throwError(err);
        })
      )
      .subscribe((newRole: UserRoleModel) => {
        this.toastV2Service.success('LNG_PAGE_CREATE_USER_ROLE_ACTION_CREATE_USER_ROLE_SUCCESS_MESSAGE');

        // hide dialog
        loadingDialog.close();

        // navigate to proper page
        // method handles disableDirtyConfirm too...
        this.redirectToProperPageAfterCreate(
          this.router,
          this.redirectService,
          this.authUser,
          UserRoleModel,
          'user-roles',
          newRole.id
        );
      });
  }

  /**
     * Add required permissions to token
     */
  groupOptionFormatMethod(
    sanitized: DomSanitizer,
    i18nService: I18nService,
    groupsMap: ISelectGroupMap<PermissionModel>,
    optionsMap: ISelectGroupOptionMap<IPermissionChildModel>,
    option: IPermissionChildModel
  ): ISelectGroupOptionFormatResponse {
    return UserRoleHelper.groupOptionFormatMethod(
      sanitized,
      i18nService,
      groupsMap,
      optionsMap,
      option
    );
  }

  /**
     * Group checked other option ( all / none / partial )
     */
  groupSelectionChanged(data: IGroupEventData) {
    UserRoleHelper.groupSelectionChanged(
      data,
      this.sanitized,
      this.i18nService,
      this.dialogService
    );
  }

  /**
     * Group child option check state changed
     */
  groupOptionCheckStateChanged(data: IGroupOptionEventData) {
    UserRoleHelper.groupOptionCheckStateChanged(
      data,
      this.sanitized,
      this.i18nService,
      this.dialogService
    );
  }
}
