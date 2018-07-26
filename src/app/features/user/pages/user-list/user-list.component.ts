import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';

@Component({
    selector: 'app-user-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.less']
})
export class UserListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Users', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing users
    usersList$: Observable<UserModel[]>;

    rolesList$: Observable<UserRoleModel[]>;

    constructor(
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private userRoleDataService: UserRoleDataService
    ) {
        super();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        this.rolesList$ = this.userRoleDataService.getRolesList();

        this.refreshList();
    }

    /**
     * Re(load) the Users list
     */
    refreshList() {
        // get the list of existing users
        this.usersList$ = this.userDataService.getUsersList(this.queryBuilder);
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
            .subscribe((answer: DialogAnswerButton) => {
                if (answer === DialogAnswerButton.Yes) {
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
                            this.refreshList();
                        });
                }
            });
    }

}
