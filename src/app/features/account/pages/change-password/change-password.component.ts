import { Component, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthModel } from '../../../../core/models/auth.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { PasswordChangeModel } from '../../../../core/models/password-change.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { RouterHelperService } from '../../../../core/services/helper/router-helper.service';

@Component({
    selector: 'app-change-password',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.less']
})
export class ChangePasswordComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Change Password', '.', true)
    ];

    passwordChange = new PasswordChangeModel();
    passwordConfirmModel: string;

    constructor(
        private routerHelper: RouterHelperService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService
    ) {
    }

    changePassword(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any[] = form.value;

            const data = new PasswordChangeModel(dirtyFields);

            // try to authenticate the user
            this.userDataService
                .changePassword(data)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe((auth: AuthModel) => {

                    this.snackbarService.showSuccess('Password changed!');

                    // reload state
                    this.routerHelper.navigateForce(['/account/change-password']);
                });
        }
    }

}
