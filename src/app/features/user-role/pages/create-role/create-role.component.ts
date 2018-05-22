import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs/Observable';
import { SelectOptionModel } from '../../../../shared/xt-forms/components/form-select/select-option.model';

import 'rxjs/add/operator/map';

@Component({
    selector: 'app-create-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-role.component.html',
    styleUrls: ['./create-role.component.less']
})
export class CreateRoleComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '..'),
        new BreadcrumbItemModel('Create New Role', '.', true)
    ];

    newUserRole: UserRoleModel = new UserRoleModel();
    availablePermissionsObs: Observable<SelectOptionModel[]>;

    constructor(
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService
    ) {
    }

    ngOnInit() {
        // get the list of permissions to populate the dropdown in UI
        this.availablePermissionsObs = this.userRoleDataService
            .getAvailablePermissions()
            .map((permissions) => {
                // convert permissions to Select Options
                return permissions.map((permission: string) => {
                    return new SelectOptionModel(permission, permission);
                });
            });
    }

    createNewRole(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any[] = form.value;

            const userRoleData = new UserRoleModel(dirtyFields);

            // try to authenticate the user
            this.userRoleDataService
                .createRole(userRoleData)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe();
        }
    }

}
