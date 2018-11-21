import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { PasswordChangeModel } from '../../../../core/models/password-change.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { ModelHelperService } from '../../../../core/services/helper/model-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';

@Component({
    selector: 'app-change-password',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.less']
})
export class ChangePasswordComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_CHANGE_PASSWORD_TITLE', '.', true)
    ];

    authUser: UserModel;

    passwordChange = new PasswordChangeModel();
    passwordConfirmModel: string;
    passwordChanged: boolean = false;

    constructor(
        private router: Router,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private modelHelperService: ModelHelperService,
        private authDataService: AuthDataService
    ) {
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    changePassword(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any[] = form.value;

            const data = this.modelHelperService.getModelInstance(PasswordChangeModel, dirtyFields);

            // try to authenticate the user
            this.userDataService
                .changePassword(data)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {

                    const refreshUserAndShowMessage = () => {
                        this.authDataService
                            .reloadAndPersistAuthUser()
                            .subscribe((authenticatedUser) => {
                                // in case user was forced to change password, then we don't need to redirect him since he has to set security questions
                                const redirect: boolean = !this.authUser.passwordChange;

                                // update user settings
                                this.authUser = authenticatedUser.user;

                                // display message
                                this.snackbarService.showSuccess('LNG_PAGE_CHANGE_PASSWORD_ACTION_CHANGE_PASSWORD_SUCCESS_MESSAGE');

                                // refresh page
                                if (redirect) {
                                    this.router.navigate(['/dashboard']);
                                }
                            });
                    };

                    // check if user was required to change password
                    if (this.authUser.passwordChange) {
                        // update user details so next time it's not required to change its password again
                        this.userDataService
                            .modifyUser(this.authUser.id, {passwordChange: false})
                            .subscribe(() => {
                                // refresh user data
                                refreshUserAndShowMessage();
                                // set passwordChanged to true so we can display the security questions notification.
                                this.passwordChanged = true;

                            });
                    } else {
                        // refresh user data
                        refreshUserAndShowMessage();
                    }

                });
        }
    }

}
