import { Component, HostListener } from '@angular/core';
import { determineRenderMode, RenderMode } from '../../../../core/enums/render-mode.enum';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginModel } from '../../../../core/models/login.model';
import { NgForm } from '@angular/forms';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { throwError } from 'rxjs';
import { AuthModel, IAuthTwoFactor } from '../../../../core/models/auth.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // version information
  versionData: SystemSettingsVersionModel;

  // constants
  RenderMode = RenderMode;

  // used by template
  user = new LoginModel();

  // // captcha data
  // captchaData$: Observable<SafeHtml>;
  //

  // displayCaptcha = false;
  //
  // // display enter code ?
  // twoFA: boolean = false;
  //
  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private router: Router,
    activatedRoute: ActivatedRoute
    // #TODO
    // private captchaDataService: CaptchaDataService
  ) {
    // update render mode
    this.updateRenderMode();

    // retrieve data
    this.versionData = activatedRoute.snapshot.data.version;
    // #TODO
    //     // // display captcha ?
    //     // this.displayCaptcha = versionData.captcha.login;
    //     // if (this.displayCaptcha) {
    //     //   // generate captcha
    //     //   this.refreshCaptcha();
    //     // }

    // #TODO
    // // enable back dirty changes
    // ConfirmOnFormChanges.enableAllDirtyConfirm();
    //
    // // check if user is authenticated
    // if (this.authDataService.isAuthenticated()) {
    //   // user is already authenticated; redirect to landing page
    //   this.router.navigate(['']);
    //   return;
    // }
  }

  /**
   * Login
   */
  login(form: NgForm) {
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
        dirtyFields
        // #TODO
        // this.twoFA
      )
      .pipe(
        catchError((err) => {
          // hide loading
          loadingDialog.close();

          // reset captcha no matter what...
          // #TODO
          // if (this.displayCaptcha) {
          //   this.user.captcha = '';
          //   this.refreshCaptcha();
          // }

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
          // #TODO
          // this.twoFA = true;

          // hide loading
          loadingDialog.close();

          // finished
          return;
        }

        // remove all errors
        this.toastV2Service.clearHistory();

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

  // /**
  //  * Refresh captcha
  //  */
  // refreshCaptcha() {
  //   this.captchaData$ = this.captchaDataService
  //     .generateSVG(CaptchaDataFor.LOGIN)
  //     .pipe(
  //       catchError((err) => {
  //         // show error
  //         this.toastV2Service.error(err);
  //         return throwError(err);
  //       })
  //     );
  // }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();
  }
}
