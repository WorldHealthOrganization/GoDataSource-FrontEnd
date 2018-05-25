import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/user-role.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-user-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.less']
})
export class UserListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Users', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // list of existing users
    usersListObs: Observable<UserModel[]>;

    constructor(
        private router: Router,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.loadUsersList();
    }

    /**
     * Re(load) the Users list
     */
    loadUsersList() {
        // get the list of existing roles
        this.usersListObs = this.userDataService.getUsersList();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'email', 'role'];

        // check if the authenticated user has WRITE access
        if (this.authUser.hasPermissions(PERMISSION.WRITE_USER_ACCOUNT)) {
            columns.push('actions');
        }

        return columns;
    }

    deleteUser(user: UserModel) {
        // show confirm dialog to confirm the action
        if (confirm(`Are you sure you want to delete this user: ${user.firstName} ${user.lastName}?`)) {
            // delete the user
            this.userDataService
                .deleteUser(user.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('User deleted!');

                    // reload data
                    this.loadUsersList();
                });
        }
    }

}
