import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';

import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';

@Component({
    selector: 'app-roles-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './roles-list.component.html',
    styleUrls: ['./roles-list.component.less']
})
export class RolesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // list of existing roles
    rolesList$: Observable<UserRoleModel[]>;

    constructor(
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        super();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        this.refreshList();
    }

    /**
     * Re(load) the User Roles list
     */
    refreshList() {
        // get the list of existing roles
        this.rolesList$ = this.userRoleDataService.getRolesList(this.queryBuilder);
    }

    deleteRole(userRole: UserRoleModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_USER_ROLE', userRole)
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    // delete the role
                    this.userRoleDataService
                        .deleteRole(userRole.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('Role deleted!');

                            // reload data
                            this.refreshList();
                        });
                }
            });
    }

    /**
     * Check if we have write access to user roles
     * @returns {boolean}
     */
    hasUserRoletWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_ROLE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['name', 'description', 'permissions'];

        // check if the authenticated user has WRITE access
        if (this.hasUserRoletWriteAccess()) {
            columns.push('actions');
        }

        return columns;
    }
}
