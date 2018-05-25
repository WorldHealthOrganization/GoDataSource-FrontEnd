import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs/Observable';
import { SelectOptionModel } from '../../../../shared/xt-forms/components/form-select/select-option.model';

import 'rxjs/add/operator/map';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-create-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-role.component.html',
    styleUrls: ['./create-role.component.less']
})
export class CreateRoleComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '..'),
        new BreadcrumbItemModel('Create New Role', '.', true)
    ];

    newUserRole: UserRoleModel = new UserRoleModel();
    availablePermissionsObs: Observable<SelectOptionModel[]>;

    constructor(
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        // get the list of permissions to populate the dropdown in UI
        this.availablePermissionsObs = this.userRoleDataService
            .getAvailablePermissions()
            .map((permissions) => {
                // convert permissions to Select Options
                return permissions.map((permission: string) => {
                    return new SelectOptionModel(permission, permission, permission);
                });
            });
    }

    createNewRole(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // try to authenticate the user
            this.userRoleDataService
                .createRole(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('Role created!');

                    // navigate to listing page
                    this.router.navigate(['/user-roles']);
                });
        }
    }

}
