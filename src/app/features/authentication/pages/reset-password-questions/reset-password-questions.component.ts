import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { ActivatedRoute, Router } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { SecurityQuestionModel } from '../../../../core/models/securityQuestion.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { Observable, throwError } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { CaptchaDataFor, CaptchaDataService } from '../../../../core/services/data/captcha.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { NgForm } from '@angular/forms';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';

@Component({
  selector: 'app-reset-password-questions',
  templateUrl: './reset-password-questions.component.html',
  styleUrls: ['./reset-password-questions.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ResetPasswordQuestionsComponent {
  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // version information
  versionData: SystemSettingsVersionModel;

  // captcha data
  displayCaptcha = false;
  captchaData$: Observable<SafeHtml>;
  captcha: string;

  // security questions
  securityQuestionsOptions: ILabelValuePairModel[];

  // constants
  RenderMode = RenderMode;

  /**
   * Constructor
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authDataService: AuthDataService,
    private captchaDataService: CaptchaDataService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    private formHelperService: FormHelperService,
    private userDataService: UserDataService
  ) {
    // check if user is authenticated
    if (this.authDataService.isAuthenticated()) {
      // user is already authenticated; redirect to landing page
      this.router.navigate(['']);

      // finished
      return;
    }

    // update render mode
    this.updateRenderMode();

    // retrieve data
    this.versionData = activatedRoute.snapshot.data.version;
    this.securityQuestionsOptions = (this.activatedRoute.snapshot.data.securityQuestions as IResolverV2ResponseModel<SecurityQuestionModel>).options;

    // display captcha ?
    this.displayCaptcha = this.versionData.captcha.resetPasswordQuestions;
    if (this.displayCaptcha) {
      // generate captcha
      this.refreshCaptcha();
    }
  }

  /**
   * Reset password
   */
  resetPassword(form: NgForm) {
    // can't proceed ?
    if (!form.valid) {
      return;
    }

    // show loading
    const loadingDialog = this.dialogV2Service.showLoadingDialog();

    // reset
    const dirtyFields: any = this.formHelperService.getDirtyFields(form);
    this.userDataService
      .resetPasswordQuestions(dirtyFields)
      .pipe(
        catchError((err) => {
          // hide loading
          loadingDialog.close();

          // reset captcha no matter what...
          if (this.displayCaptcha) {
            this.captcha = '';
            this.refreshCaptcha();
          }

          // show error
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((result: any) => {
        // hide loading
        loadingDialog.close();

        // send the user to reset password page
        this.router.navigate(['/auth/reset-password'], { queryParams: { token: result.token } });
      });
  }

  /**
   * Refresh captcha
   */
  refreshCaptcha(): void {
    this.captchaData$ = this.captchaDataService
      .generateSVG(CaptchaDataFor.RESET_PASSWORD_QUESTIONS)
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();
  }
}
