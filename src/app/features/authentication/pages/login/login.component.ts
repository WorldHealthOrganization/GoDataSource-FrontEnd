import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { Observable, throwError } from 'rxjs';
import { AuthModel, IAuthTwoFactor } from '../../../../core/models/auth.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserModel } from '../../../../core/models/user.model';
import { SafeHtml } from '@angular/platform-browser';
import { CaptchaDataFor, CaptchaDataService } from '../../../../core/services/data/captcha.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Constants } from '../../../../core/models/constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // version information
  versionData: SystemSettingsVersionModel;

  // go data who link
  readonly goDataWhoLink: string = Constants.GO_DATA_WHO_LINK;

  // captcha data
  displayCaptcha = false;
  captchaData$: Observable<SafeHtml>;
  captcha: string;

  // display enter code ?
  twoFA: boolean = false;

  // page type
  pageType: CaptchaDataFor;

  // constants
  RenderMode = RenderMode;
  CaptchaDataFor = CaptchaDataFor;

  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private router: Router,
    private captchaDataService: CaptchaDataService,
    private userDataService: UserDataService,
    activatedRoute: ActivatedRoute
  ) {
    // enable back dirty changes
    ConfirmOnFormChanges.enableAllDirtyConfirm();

    // check if user is authenticated
    if (this.authDataService.isAuthenticated()) {
      // user is already authenticated; redirect to landing page
      this.router.navigate(['']);

      // finished
      return;
    }

    // retrieve page type
    this.pageType = activatedRoute.snapshot.data.page;

    // update render mode
    this.updateRenderMode();

    // retrieve data
    this.versionData = activatedRoute.snapshot.data.version;

    // display captcha ?
    this.displayCaptcha = this.pageType === CaptchaDataFor.LOGIN ?
      this.versionData.captcha.login :
      this.versionData.captcha.forgotPassword;
    if (this.displayCaptcha) {
      // generate captcha
      this.refreshCaptcha();
    }
  }

  /**
   * Login
   */
  login(form: NgForm): void {
    // can't proceed ?
    if (!form.valid) {
      return;
    }

    // show loading
    const loadingDialog = this.dialogV2Service.showLoadingDialog();

    // try to authenticate the user
    const dirtyFields: any = form.value;
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
            this.captcha = '';
            this.refreshCaptcha();
          }

          // show error
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((auth: IAuthTwoFactor | AuthModel) => {
        // two factor authentication
        if ((auth as IAuthTwoFactor).twoFA) {
          // display message that 2FA is active
          this.toastV2Service.success(
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

        // remove all errors
        this.toastV2Service.clearHistory();

        // successfully authenticated;
        // - use authenticated user's preferred language
        // - invalidate language
        const authModel: AuthModel = auth as AuthModel;
        this.i18nService.clearStorage();
        this.i18nService
          .loadUserLanguage()
          .pipe(
            catchError((err) => {
              // hide loading
              loadingDialog.close();

              // show api error
              this.toastV2Service.error(err);
              return throwError(err);
            })
          )
          .subscribe(() => {
            // show success message
            this.toastV2Service.success(
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

  /**
   * Forgot password
   */
  forgotPassword(form: NgForm): void {
    // can't proceed ?
    if (!form.valid) {
      return;
    }

    // show loading
    const loadingDialog = this.dialogV2Service.showLoadingDialog();

    // send the "password reset" e-mail
    const dirtyFields: any = form.value;
    this.userDataService
      .forgotPassword(dirtyFields)
      .pipe(
        catchError((err) => {
          // reset captcha no matter what...
          if (this.displayCaptcha) {
            this.captcha = '';
            this.refreshCaptcha();
          }

          // hide dialog
          loadingDialog.close();

          // show error
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success(
          'LNG_PAGE_FORGOT_PASSWORD_ACTION_SEND_EMAIL_SUCCESS_MESSAGE',
          { email: dirtyFields.email }
        );

        // hide loading
        loadingDialog.close();

        // redirect to login page
        this.router.navigate(['/auth/login']);
      });
  }

  /**
   * Refresh captcha
   */
  refreshCaptcha(): void {
    this.captchaData$ = this.captchaDataService
      .generateSVG(this.pageType)
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
