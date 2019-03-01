import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

@Component({
    selector: 'app-create-user',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-user.component.html',
    styleUrls: ['./create-user.component.less']
})
export class CreateUserComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '..'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_USER_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    newUser: UserModel = new UserModel();
    passwordConfirmModel: string;
    rolesList$: Observable<UserRoleModel[]>;
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        private router: Router,
        private userDataService: UserDataService,
        private userRoleDataService: UserRoleDataService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService
    ) {
        super();
    }

    ngOnInit() {
        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();
    }

    createNewUser(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // remove password confirm
        if (dirtyFields.passwordConfirm) {
            delete dirtyFields.passwordConfirm;
        }

        if (form.valid && !_.isEmpty(dirtyFields)) {
            // try to authenticate the user
            this.userDataService
                .createUser(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe((newUser: UserModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/users/${newUser.id}/modify`]);
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
