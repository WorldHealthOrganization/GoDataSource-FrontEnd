import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { SecurityQuestionModel } from '../../../../core/models/securityQuestion.model';
import { throwError } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { SafeHtml } from '@angular/platform-browser';
import { CaptchaDataFor, CaptchaDataService } from '../../../../core/services/data/captcha.data.service';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';

@Component({
    selector: 'app-reset-password-questions',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reset-password-questions.component.html',
    styleUrls: ['./reset-password-questions.component.less']
})
export class ResetPasswordQuestionsComponent implements OnInit {
    // captcha data
    captchaData$: Observable<SafeHtml>;

    // loading data ?
    loading = true;
    displayCaptcha = false;

    // data
    dataModel = {
        captcha: '',
        email: null,
        questions: [{question: null, answer: null}, {question: null, answer: null}]
   };
    securityQuestionsList$: Observable<SecurityQuestionModel[]>;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private userDataService: UserDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private captchaDataService: CaptchaDataService,
        private systemSettingsDataService: SystemSettingsDataService
    ) {
        this.securityQuestionsList$ = this.userDataService.getSecurityQuestionsList().pipe(share());
    }

    /**
     * Initialize
     */
    ngOnInit() {
        // check if user is authenticated
        if (this.authDataService.isAuthenticated()) {
            // user is already authenticated; redirect to dashboard home page
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
                this.displayCaptcha = versionData.captcha.resetPasswordQuestions;
                if (this.displayCaptcha) {
                    // generate captcha
                    this.refreshCaptcha();
                }
            });
    }

    /**
     * Reset password
     */
    resetPassword(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        if (form.valid && !_.isEmpty(dirtyFields)) {
            // send request to get token
            this.userDataService
                .resetPasswordQuestions(dirtyFields)
                .pipe(
                    catchError((err) => {
                        // reset captcha no matter what...
                        if (this.displayCaptcha) {
                            this.dataModel.captcha = '';
                            this.refreshCaptcha();
                        }

                        // finish
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    })
                )
                .subscribe((result: any) => {
                    // send the user to reset password page
                    this.router.navigate(['/auth/reset-password'], { queryParams: { token: result.token } });
                 });


        }
    }

    /**
     * Refresh captcha
     */
    refreshCaptcha() {
        this.captchaData$ = this.captchaDataService
            .generateSVG(CaptchaDataFor.RESET_PASSWORD_QUESTIONS)
            .pipe(
                catchError((err) => {
                    // show error
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            );
    }
}
