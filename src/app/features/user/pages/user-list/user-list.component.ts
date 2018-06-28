import { Component, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { RequestQueryBuilder } from '../../../../core/services/helper/request-query-builder';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';

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
    usersList$: Observable<UserModel[]>;
    usersListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    constructor(
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.loadUsersList();
    }

    /**
     * Re(load) the Users list
     */
    loadUsersList() {
        // get the list of existing users
        this.usersList$ = this.userDataService.getUsersList(this.usersListQueryBuilder);
    }

    /**
     * Filter the Users list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        // filter by any User property
        this.usersListQueryBuilder.where({
            [property]: {
                regexp: `/^${value}/i`
            }
        });

        // refresh users list
        this.loadUsersList();
    }

    /**
     * Check if we have write access to users
     * @returns {boolean}
     */
    hasUserWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_USER_ACCOUNT);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = ['firstName', 'lastName', 'email', 'role'];

        // check if the authenticated user has WRITE access
        if (this.hasUserWriteAccess()) {
            columns.push('actions');
        }

        return columns;
    }

    deleteUser(user: UserModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_USER', user)
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
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
            });
    }

}
