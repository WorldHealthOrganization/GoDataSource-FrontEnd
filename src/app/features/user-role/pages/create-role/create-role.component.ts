import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { throwError } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
import { IPermissionChildModel, PermissionModel } from '../../../../core/models/permission.model';
import { DomSanitizer } from '@angular/platform-browser';
import { UserRoleHelper } from '../../../../core/helperClasses/user-role.helper';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-role.component.html',
    styleUrls: ['./create-role.component.less']
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

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private sanitized: DomSanitizer,
        private i18nService: I18nService,
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

        // get the list of permissions to populate the dropdown in UI
        this.availablePermissions$ = this.userRoleDataService
            .getAvailablePermissions()
            .pipe(share());

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
                    this.snackbarService.showApiError(err);
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((newRole: UserRoleModel) => {
                this.snackbarService.showSuccess('LNG_PAGE_CREATE_USER_ROLE_ACTION_CREATE_USER_ROLE_SUCCESS_MESSAGE');

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
