import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

import * as _ from 'lodash';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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

    displayLoading: boolean = false;

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

        // display loading
        this.displayLoading = true;

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (form.valid && !_.isEmpty(dirtyFields)) {

            // send the "password reset" e-mail
            this.userDataService
                .forgotPassword(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);
                        return throwError(err);
                    })
                )
                .subscribe(() => {
                    this.snackbarService.showSuccess(
                        `LNG_PAGE_FORGOT_PASSWORD_ACTION_SEND_EMAIL_SUCCESS_MESSAGE`,
                        {email: dirtyFields.email}
                    );

                    // hide loading
                    this.displayLoading = false;

                    // redirect to login page
                    this.router.navigate(['/auth/login']);
                });
        }
    }

}
