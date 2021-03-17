import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { IPermissionChildModel, PermissionModel } from '../../../../core/models/permission.model';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, share } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../../shared/xt-forms/components/form-select-groups/form-select-groups.component';
import { DomSanitizer } from '@angular/platform-browser';
import { UserRoleHelper } from '../../../../core/helperClasses/user-role.helper';

@Component({
    selector: 'app-modify-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-role.component.html',
    styleUrls: ['./modify-role.component.less']
})
export class ModifyRoleComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    PermissionModel = PermissionModel;
    UserRoleModel = UserRoleModel;

    authUser: UserModel;
    userRoleId: string;
    userRole: UserRoleModel = new UserRoleModel();
    availablePermissions$: Observable<PermissionModel[]>;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService,
        protected dialogService: DialogService,
        private i18nService: I18nService,
        private sanitized: DomSanitizer
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialization
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // show loading
        this.showLoadingDialog(false);

        this.route.params.subscribe((params: {roleId}) => {
            // get the ID of the Role being modified
            this.userRoleId = params.roleId;

            // retrieve the User Role instance
            this.userRoleDataService
                .getRole(this.userRoleId)
                .subscribe((role: UserRoleModel) => {
                    this.userRole = role;

                    // hide loading
                    this.hideLoadingDialog();
                });
        });

        // get the list of permissions to populate the dropdown in UI
        this.availablePermissions$ = this.userRoleDataService
            .getAvailablePermissions()
            .pipe(share());

        // update breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (UserRoleModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_USER_ROLES_TITLE', '/user-roles')
            );
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ?
                    'LNG_PAGE_VIEW_USER_ROLES_TITLE' :
                    'LNG_PAGE_MODIFY_USER_ROLES_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Modify Role
     */
    modifyRole(form: NgForm) {
        // get dirty fields & validate form
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // modify the role
        this.userRoleDataService
            .modifyRole(this.userRoleId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((modifiedRole: UserRoleModel) => {
                // update model
                this.userRole = modifiedRole;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_USER_ROLES_ACTION_MODIFY_USER_ROLES_SUCCESS_MESSAGE');

                // hide loading
                this.hideLoadingDialog();
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
