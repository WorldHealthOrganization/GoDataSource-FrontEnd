import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { NgForm } from '@angular/forms';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

import * as _ from 'lodash';

@Component({
    selector: 'app-create-user',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-user.component.html',
    styleUrls: ['./create-user.component.less']
})
export class CreateUserComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Users', '..'),
        new BreadcrumbItemModel('Create New User', '.', true)
    ];

    newUser: UserModel = new UserModel();
    passwordConfirmModel: string;
    rolesList$: Observable<UserRoleModel[]>;

    constructor(
        private router: Router,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();
    }

    createNewUser(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // try to authenticate the user
            this.userDataService
                .createUser(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('User created!');

                    // navigate to listing page
                    this.router.navigate(['/users']);
                });
        }
    }
}
