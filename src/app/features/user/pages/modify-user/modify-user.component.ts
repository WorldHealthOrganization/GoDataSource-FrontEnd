import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { NgForm } from '@angular/forms';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

import * as _ from 'lodash';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';

@Component({
    selector: 'app-modify-user',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-user.component.html',
    styleUrls: ['./modify-user.component.less']
})
export class ModifyUserComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Users', '/users'),
        new BreadcrumbItemModel('Modify User', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    userId: string;
    user: UserModel = new UserModel();
    passwordConfirmModel: string;
    rolesList$: Observable<UserRoleModel[]>;
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the route params
        this.route.params.subscribe((params: {userId}) => {
            // get the ID of the User being modified
            this.userId = params.userId;

            // retrieve the User instance
            this.userDataService
                .getUser(this.userId)
                .subscribe((user: UserModel) => {
                    this.user = user;
                });
        });

        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();
    }

    modifyUser(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // modify the user
            this.userDataService
                .modifyUser(this.userId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {

                    // reload user auth data in case he's changing the active outbreaqk
                    this.authDataService
                        .reloadAndPersistAuthUser()
                        .subscribe((authenticatedUser) => {
                            this.snackbarService.showSuccess('User modified!');
                            // navigate to listing page
                            this.router.navigate(['/users']);
                        });
                });
        }
    }

    /**
     * Check if the user has read access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK);
    }
}
