import { Component, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';

import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-roles-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './roles-list.component.html',
    styleUrls: ['./roles-list.component.less']
})
export class RolesListComponent {

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
        private snackbarService: SnackbarService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.loadRolesList();
    }

    /**
     * Re(load) the User Roles list
     */
    loadRolesList() {
        // get the list of existing roles
        this.rolesList$ = this.userRoleDataService.getRolesList();
    }

    deleteRole(userRole: UserRoleModel) {
        // show confirm dialog to confirm the action
        if (confirm(`Are you sure you want to delete this role: ${userRole.name}?`)) {
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
                    this.loadRolesList();
                });
        }
    }
}
