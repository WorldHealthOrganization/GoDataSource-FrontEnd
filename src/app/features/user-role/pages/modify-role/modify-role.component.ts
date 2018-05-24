import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    selector: 'app-modify-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-role.component.html',
    styleUrls: ['./modify-role.component.less']
})
export class ModifyRoleComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '/user-roles'),
        new BreadcrumbItemModel('Modify Role', '.', true)
    ];

    userRoleId: string;
    userRole: UserRoleModel = new UserRoleModel();
    availablePermissionsObs: Observable<SelectOptionModel[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        this.route.params.subscribe((params) => {
            // get the ID of the Role being modified
            this.userRoleId = params.roleId;

            // retrieve the User Role instance
            this.userRoleDataService
                .getRole(this.userRoleId)
                .subscribe((roleData) => {
                    this.userRole = new UserRoleModel(roleData);
                });
        });
    }

    ngOnInit() {
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

    modifyRole(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // modify the role
            this.userRoleDataService
                .modifyRole(this.userRoleId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('Role modified!');

                    // navigate to listing page
                    this.router.navigate(['/user-roles']);
                });
        }
    }

}
