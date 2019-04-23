import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { LoginModel } from '../../../../core/models/login.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthModel } from '../../../../core/models/auth.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {

    user = new LoginModel();

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService
    ) {
    }

    ngOnInit() {
        // check if user is authenticated
        if (this.authDataService.isAuthenticated()) {
            // user is already authenticated; redirect to dashboard home page
            this.router.navigate(['']);
        }
    }

    login(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any = form.value;

            // try to authenticate the user
            this.authDataService
                .login(dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    })
                )
                .subscribe((auth: AuthModel) => {
                    // successfully authenticated;

                    // use authenticated user's preferred language
                    this.i18nService
                        .loadUserLanguage()
                        .subscribe(() => {

                            this.snackbarService.showSuccess(
                                'LNG_PAGE_LOGIN_ACTION_LOGIN_SUCCESS_MESSAGE',
                                {
                                    name: `${auth.user.firstName} ${auth.user.lastName}`
                                }
                            );

                            // check if user needs to change password
                            if (auth.user.passwordChange) {
                                // user must change password
                                this.router.navigate(['/account/change-password']);
                            } else {
                                // redirect to dashboard landing page
                                this.router.navigate(['']);
                            }

                        });

                });
        }
    }

}
