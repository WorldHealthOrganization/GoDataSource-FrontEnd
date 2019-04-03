import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';

import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-role.component.html',
    styleUrls: ['./modify-role.component.less']
})
export class ModifyRoleComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_USER_ROLES_TITLE', '/user-roles'),
    ];

    authUser: UserModel;
    userRoleId: string;
    userRole: UserRoleModel = new UserRoleModel();
    availablePermissions$: Observable<any[]>;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService,
        private dialogService: DialogService
    ) {
        super(route);
        this.route.params.subscribe((params: {roleId}) => {
            // get the ID of the Role being modified
            this.userRoleId = params.roleId;

            // retrieve the User Role instance
            this.userRoleDataService
                .getRole(this.userRoleId)
                .subscribe((role: UserRoleModel) => {
                    this.userRole = role;
                });
        });

        // get the list of permissions to populate the dropdown in UI
        this.availablePermissions$ = this.userRoleDataService.getAvailablePermissions();
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_USER_ROLES_TITLE' : 'LNG_PAGE_MODIFY_USER_ROLES_TITLE',
                '.',
                true
            )
        );
    }

    modifyRole(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // modify the role
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.userRoleDataService
                .modifyRole(this.userRoleId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
                .subscribe((modifiedRole: UserRoleModel) => {
                    // update model
                    this.userRole = modifiedRole;

                    // mark form as pristine
                    form.form.markAsPristine();

                    // display message
                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_USER_ROLES_ACTION_MODIFY_USER_ROLES_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();
                });
        }
    }
    /**
     * Check if we have write access to users
     * @returns {boolean}
     */
    hasUserRoleWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_ROLE);
    }
}
