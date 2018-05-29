import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

import * as _ from 'lodash';

@Component({
    selector: 'app-forgot-password',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.less']
})
export class ForgotPasswordComponent implements OnInit {

    dataModel = {
        email: null
    };

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
    }

    ngOnInit() {
        // check if user is authenticated
        if (this.authDataService.isAuthenticated()) {
            // user is already authenticated; redirect to dashboard home page
            this.router.navigate(['']);
        }
    }

    forgotPassword(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // send the "password reset" e-mail
            this.userDataService
                .forgotPassword(dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {

                    this.snackbarService.showSuccess(
                        `Reset password instructions were sent to ${dirtyFields.email}, if the email address is associated with an account.`,
                        10000
                    );

                    // redirect to login page
                    this.router.navigate(['/auth/login']);
                });
        }
    }

}
