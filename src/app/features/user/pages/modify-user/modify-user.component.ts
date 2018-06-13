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

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the route params
        this.route.params.subscribe((params) => {
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
    }

    modifyUser(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // modify the role
            this.userDataService
                .modifyUser(this.userId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('User modified!');

                    // navigate to listing page
                    this.router.navigate(['/users']);
                });
        }
    }
}
