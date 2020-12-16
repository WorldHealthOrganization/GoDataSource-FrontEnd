import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthModel, IAuthTwoFactor } from '../../../../core/models/auth.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserModel } from '../../../../core/models/user.model';
import { LoginModel } from '../../../../core/models/login.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { CaptchaDataFor, CaptchaDataService } from '../../../../core/services/data/captcha.data.service';
import { Observable } from 'rxjs/internal/Observable';
import { SafeHtml } from '@angular/platform-browser';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';

@Component({
    selector: 'app-login',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
    // used by template
    user = new LoginModel();

    // captcha data
    captchaData$: Observable<SafeHtml>;

    // loading data ?
    loading = true;
    displayCaptcha = false;

    // display enter code ?
    twoFA: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        protected dialogService: DialogService,
        private captchaDataService: CaptchaDataService,
        private systemSettingsDataService: SystemSettingsDataService
    ) {}

    /**
     * Initialize
     */
    ngOnInit() {
        // enable back dirty changes
        ConfirmOnFormChanges.enableAllDirtyConfirm();

        // check if user is authenticated
        if (this.authDataService.isAuthenticated()) {
            // user is already authenticated; redirect to landing page
            this.router.navigate(['']);
            return;
        }

        // retrieve if we should display captcha or not
        // display loading while determining if we should display captcha
        this.loading = true;
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((versionData: SystemSettingsVersionModel) => {
                // finished
                this.loading = false;

                // display captcha ?
                this.displayCaptcha = versionData.captcha.login;
                if (this.displayCaptcha) {
                    // generate captcha
                    this.refreshCaptcha();
                }
            });
    }

    /**
     * Login
     */
    login(form: NgForm) {
        if (form.valid) {
            const dirtyFields: any = form.value;

            // show loading
            const loadingDialog = this.dialogService.showLoadingDialog();

            // try to authenticate the user
            this.authDataService
                .login(
                    dirtyFields,
                    this.twoFA
                )
                .pipe(
                    catchError((err) => {
                        // hide loading
                        loadingDialog.close();

                        // reset captcha no matter what...
                        if (this.displayCaptcha) {
                            this.user.captcha = '';
                            this.refreshCaptcha();
                        }

                        // show error
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    })
                )
                .subscribe((auth: IAuthTwoFactor | AuthModel) => {
                    // two factor authentication
                    if ((auth as IAuthTwoFactor).twoFA) {
                        // display message that 2FA is active
                        this.snackbarService.showSuccess(
                            'LNG_PAGE_LOGIN_ACTION_LOGIN_2FA_CODE_REQUIRED',
                            {
                                email: dirtyFields.email
                            }
                        );

                        // must enter code before we can login
                        this.twoFA = true;

                        // hide loading
                        loadingDialog.close();

                        // finished
                        return;
                    }

                    // successfully authenticated;
                    // use authenticated user's preferred language
                    // invalidate language
                    const authModel: AuthModel = auth as AuthModel;
                    this.i18nService.clearStorage();
                    this.i18nService
                        .loadUserLanguage()
                        .pipe(
                            catchError((err) => {
                                // hide loading
                                loadingDialog.close();

                                // show api error
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // show success message
                            this.snackbarService.showSuccess(
                                'LNG_PAGE_LOGIN_ACTION_LOGIN_SUCCESS_MESSAGE',
                                {
                                    name: `${authModel.user.firstName} ${authModel.user.lastName}`
                                }
                            );

                            // hide loading
                            loadingDialog.close();

                            // check if user needs to change password
                            if (
                                authModel.user.passwordChange &&
                                UserModel.canModifyOwnAccount(this.authDataService.getAuthenticatedUser())
                            ) {
                                // user must change password
                                this.router.navigate(['/account/change-password']);
                            } else {
                                // redirect to landing page
                                this.router.navigate(['']);
                            }
                        });
                });
        }
    }

    /**
     * Refresh captcha
     */
    refreshCaptcha() {
        this.captchaData$ = this.captchaDataService
            .generateSVG(CaptchaDataFor.LOGIN)
            .pipe(
                catchError((err) => {
                    // show error
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            );
    }
}
