import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { AuthDataService } from '../../services/data/auth.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { AppSideDialogV2Component } from '../../../shared/components-v2/app-side-dialog-v2/app-side-dialog-v2.component';
import { DialogV2Service } from '../../services/helper/dialog-v2.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { V2SideDialogConfigAction } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { IV2LoadingDialogHandler } from '../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { ChildActivationStart, NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { DashboardModel } from '../../models/dashboard.model';
import { ConfirmOnFormChanges, PageChangeConfirmationGuard } from '../../services/guards/page-change-confirmation-guard.service';
import { determineRenderMode, RenderMode } from '../../enums/render-mode.enum';
import { DebounceTimeCaller, DebounceTimeCallerType } from '../../helperClasses/debounce-time-caller';
import { throwError } from 'rxjs';
import { ITokenInfo } from '../../models/auth.model';
import { UserDataService } from '../../services/data/user.data.service';
import { catchError } from 'rxjs/operators';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { AppBottomDialogV2Component } from '../../../shared/components-v2/app-bottom-dialog-v2/app-bottom-dialog-v2.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LocalizationHelper, Moment } from '../../helperClasses/localization-helper';

@Component({
  selector: 'app-authenticated',
  templateUrl: './authenticated.component.html',
  styleUrls: ['./authenticated.component.scss']
})
export class AuthenticatedComponent implements OnInit, OnDestroy {
  // disable page loading
  static DISABLE_PAGE_LOADING: boolean = false;

  // display popup when less than 2 minutes
  static NO_ACTIVITY_POPUP_SHOULD_REDIRECT_IF_LESS_THAN_SECONDS = -5;
  static NO_ACTIVITY_POPUP_SHOULD_APPEAR_WHEN_LESS_THAN_SECONDS = 120;
  static NO_ACTIVITY_POPUP_SHOULD_REFRESH_TOKEN_IF_USER_ACTIVE = 240;
  static REFRESH_IF_USER_WAS_ACTIVE_IN_THE_LAST_SECONDS = 20;
  static REFRESH_DISABLE_SECONDS = 7;

  // full screen ?
  static FULL_SCREEN: boolean = false;
  get fullScreen(): boolean {
    return AuthenticatedComponent.FULL_SCREEN;
  }

  // Side Nav
  @ViewChild('sideDialog', { static: true }) sideDialog: AppSideDialogV2Component;

  // subscriptions
  sideDialogSubjectSubscription: Subscription;

  // expand menu
  expandMenu: boolean = false;
  hoveringMenu: boolean = false;

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // authenticated user
  private _authUser: UserModel;

  // subscription
  private routerEventsSubscriptionLoad: Subscription;
  private routerEventsSubscriptionRepetitive: Subscription;
  private tokenInfoSubjectSubscription: Subscription;
  private _determineSelectedOutbreakSubscription: Subscription;
  private _getSelectedOutbreakSubscription: Subscription;

  // constants
  RenderMode = RenderMode;

  // menu loading dialog
  private menuLoadingDialog: IV2LoadingDialogHandler;

  // token expire data
  private lastRefreshUserTokenOrLogOut: Moment;
  private lastInputTime: Moment;
  private confirmDialog: MatBottomSheetRef<AppBottomDialogV2Component>;
  private tokenInfo: ITokenInfo;
  private tokenExpirePopupIsVisible: boolean = false;
  private documentKeyUp: () => void;
  private documentMouseMove: () => void;
  private tokenCheckIfLoggedOutCaller: DebounceTimeCaller = new DebounceTimeCaller(
    () => {
      // check if we must check if we;re logged out
      // -7 seconds error marje
      if (
        !this.tokenInfo ||
        this.tokenInfo.isValid ||
        this.tokenInfo.approximatedExpireInSecondsReal > AuthenticatedComponent.NO_ACTIVITY_POPUP_SHOULD_REDIRECT_IF_LESS_THAN_SECONDS
      ) {
        // if user is active, then we need to refresh token
        if (
          this.lastInputTime &&
          this.tokenInfo &&
          this.tokenInfo.approximatedExpireInSecondsReal > AuthenticatedComponent.NO_ACTIVITY_POPUP_SHOULD_APPEAR_WHEN_LESS_THAN_SECONDS &&
          this.tokenInfo.approximatedExpireInSecondsReal < AuthenticatedComponent.NO_ACTIVITY_POPUP_SHOULD_REFRESH_TOKEN_IF_USER_ACTIVE &&
          Math.floor(LocalizationHelper.now().diff(this.lastInputTime) / 1000) < AuthenticatedComponent.REFRESH_IF_USER_WAS_ACTIVE_IN_THE_LAST_SECONDS
        ) {
          // retrieve the user instance or log out
          this.refreshUserTokenOrLogOut(true);
        } else {
          // check again later
          this.tokenCheckIfLoggedOutCaller.call();
        }
      } else {
        // retrieve the user instance or log out
        this.refreshUserTokenOrLogOut(false);
      }
    },
    3000,
    DebounceTimeCallerType.DONT_RESET_AND_WAIT
  );

  // timers
  private _tokenExpireTimer: number;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private outbreakDataService: OutbreakDataService,
    private dialogV2Service: DialogV2Service,
    private router: Router,
    private userDataService: UserDataService
  ) {
    // detect when the route is changed
    this.routerEventsSubscriptionLoad = this.router.events.subscribe((event) => {
      if (AuthenticatedComponent.DISABLE_PAGE_LOADING) {
        return;
      }

      // display loading spinner
      // - NavigationStart & RouteConfigLoadStart can't be used because create / modify confirm dirty dialog won't work anymore, it will be blocked by the loading dialog
      if (event instanceof ChildActivationStart) {
        this.showLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel
      ) {
        this.hideLoading();
      }
    });

    // update render mode
    this.updateRenderMode();
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();

    // check if user is authenticated
    if (!this._authUser) {
      // user is NOT authenticated; redirect to Login page
      this.prepareForRedirect();
      this.router.navigate(['/auth/login']);
      return;
    }

    // handle auth token expire popup
    this.initializeTokenExpireHandler();

    // used to handle side dialog requests
    this.sideDialogSubjectSubscription = this.dialogV2Service.sideDialogSubject$
      .subscribe((data) => {
        // hide dialog
        if (data.action === V2SideDialogConfigAction.CLOSE) {
          // show dialog
          this.sideDialog.hide();

          // finished
          return;
        }

        // show dialog
        this.sideDialog
          .show(data.config)
          .subscribe((response) => {
            data.responseSubscriber(response);
            data.responseSubscriber = undefined;
          });
      });

    // determine the Selected Outbreak and display message if different than the active one.
    if (OutbreakModel.canView(this._authUser)) {
      this._determineSelectedOutbreakSubscription = this.outbreakDataService
        .determineSelectedOutbreak()
        .subscribe(() => {
          // release
          this.stopGetSelectedOutbreak();

          // trigger
          this._getSelectedOutbreakSubscription = this.outbreakDataService.getSelectedOutbreakSubject()
            .subscribe(() => {
              this.outbreakDataService.checkActiveSelectedOutbreak();
            });
        });
    }

    // redirect root to landing page
    const redirectRootToLandingPage = () => {
      // redirect to default landing page
      if (DashboardModel.canViewDashboard(this._authUser)) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/account/my-profile']);
      }
    };

    // subscribe to uri changes
    this.routerEventsSubscriptionRepetitive = this.router.events.subscribe((navStart: NavigationEnd) => {
      // handle only final navigation events, since we need to retrieve data only after we get to that page ( guards, etc )
      if (!(navStart instanceof NavigationEnd)) {
        return;
      }

      // redirect root to landing page
      if (navStart.url === '/') {
        return redirectRootToLandingPage();
      }

      // collapse hovering menu on page change
      this.hoveringMenu = false;
    });

    // redirect root to landing page
    if (this.router.url === '/') {
      return redirectRootToLandingPage();
    }
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release side dialog subscription
    if (this.sideDialogSubjectSubscription) {
      this.sideDialogSubjectSubscription.unsubscribe();
      this.sideDialogSubjectSubscription = undefined;
    }

    // hide loading in case it is still visible
    this.hideLoading();

    // release
    if (this.routerEventsSubscriptionLoad) {
      this.routerEventsSubscriptionLoad.unsubscribe();
      this.routerEventsSubscriptionLoad = null;
    }

    // release
    if (this.routerEventsSubscriptionRepetitive) {
      this.routerEventsSubscriptionRepetitive.unsubscribe();
      this.routerEventsSubscriptionRepetitive = null;
    }

    // release token info subscription
    if (this.tokenInfoSubjectSubscription) {
      this.tokenInfoSubjectSubscription.unsubscribe();
      this.tokenInfoSubjectSubscription = null;
    }

    // release
    if (this.tokenCheckIfLoggedOutCaller) {
      this.tokenCheckIfLoggedOutCaller.unsubscribe();
      this.tokenCheckIfLoggedOutCaller = null;
    }

    // release
    this.stopGetSelectedOutbreak();

    // release
    if (this._determineSelectedOutbreakSubscription) {
      this._determineSelectedOutbreakSubscription.unsubscribe();
      this._determineSelectedOutbreakSubscription = undefined;
    }

    // stop timers
    this.stopTokenExpireTimer();

    // remove idle handlers
    if (this.documentKeyUp) {
      document.removeEventListener('keyup', this.documentKeyUp);
    }
    if (this.documentMouseMove) {
      document.removeEventListener('mousemove', this.documentMouseMove);
    }
  }

  /**
   * Show loading spinner
   */
  showLoading() {
    // as a precaution if previous dialog is still visible then we shouldn't open a new one
    if (this.menuLoadingDialog) {
      return;
    }

    // display dialog;
    this.menuLoadingDialog = this.dialogV2Service.showLoadingDialog();
  }

  /**
   * hide loading
   */
  hideLoading() {
    if (this.menuLoadingDialog) {
      this.menuLoadingDialog.close();
      this.menuLoadingDialog = null;
    }
  }

  /**
   * Stop get selected outbreak
   */
  private stopGetSelectedOutbreak(): void {
    if (this._getSelectedOutbreakSubscription) {
      this._getSelectedOutbreakSubscription.unsubscribe();
      this._getSelectedOutbreakSubscription = undefined;
    }
  }

  /**
   * Refresh last input time
   */
  private refreshLastInputTime() {
    if (!this.lastInputTime) {
      this.lastInputTime = LocalizationHelper.now();
    } else if (LocalizationHelper.now().diff(this.lastInputTime) / 1000 > 3) {
      this.lastInputTime = LocalizationHelper.now();
    }
  }

  /**
   * Stop expire timer
   */
  private stopTokenExpireTimer(): void {
    if (this._tokenExpireTimer) {
      clearTimeout(this._tokenExpireTimer);
      this._tokenExpireTimer = undefined;
    }
  }

  /**
   * Handler for token expire
   */
  private initializeTokenExpireHandler() {
    // init checker if signed out
    this.tokenCheckIfLoggedOutCaller.call();

    // register idle handlers
    this.documentKeyUp = () => {
      this.refreshLastInputTime();
    };
    document.addEventListener('keyup', this.documentKeyUp);
    this.documentMouseMove = () => {
      this.refreshLastInputTime();
    };
    document.addEventListener('mousemove', this.documentMouseMove);

    // subscribe to token estimated time
    this.tokenInfoSubjectSubscription = this.authDataService
      .getTokenInfoSubject()
      .subscribe((tokenInfo) => {
        // check if token expired - display popup
        this.tokenInfo = tokenInfo;
        if (this.tokenInfo) {
          // check if we need to display popup
          if (
            !this.tokenExpirePopupIsVisible &&
            this.tokenInfo.approximatedExpireInSeconds > -1 &&
            this.tokenInfo.approximatedExpireInSeconds < AuthenticatedComponent.NO_ACTIVITY_POPUP_SHOULD_APPEAR_WHEN_LESS_THAN_SECONDS
          ) {
            // stop previous
            this.stopTokenExpireTimer();

            // popup visible
            this.tokenExpirePopupIsVisible = true;
            this._tokenExpireTimer = setTimeout(() => {
              // reset
              this._tokenExpireTimer = undefined;

              // display popup
              this.confirmDialog = this.dialogV2Service
                .showBottomDialogBare({
                  config: {
                    title: {
                      get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                    },
                    message: {
                      get: () => 'LNG_AUTHENTICATION_TOKEN_EXPIRE_DIALOG_TITLE'
                    }
                  },
                  bottomButtons: [{
                    type: IV2BottomDialogConfigButtonType.CANCEL,
                    label: 'LNG_AUTHENTICATION_TOKEN_EXPIRE_DIALOG_CONTINUE_BUTTON',
                    color: 'text'
                  }]
                });

              // show dialog
              this.confirmDialog
                .afterDismissed()
                .subscribe(() => {
                  // show loading
                  this.showLoading();

                  // retrieve the user instance
                  this.userDataService
                    .getUser(this._authUser.id)
                    .pipe(
                      catchError((err) => {
                        // log out
                        this.authDataService
                          .logout()
                          .pipe(
                            catchError(() => {
                              this.prepareForRedirect();
                              this.hideLoading();
                              this.tokenExpirePopupIsVisible = false;
                              this.confirmDialog = null;
                              this.router.navigate(['/auth/login']);
                              return throwError(err);
                            })
                          )
                          .subscribe(() => {
                            this.prepareForRedirect();
                            this.hideLoading();
                            this.tokenExpirePopupIsVisible = false;
                            this.confirmDialog = null;
                            this.router.navigate(['/auth/login']);
                          });

                        // finished
                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      // popup closed
                      this.hideLoading();
                      this.tokenExpirePopupIsVisible = false;
                      this.confirmDialog = null;
                    });
                });
            });
          }
        }
      });
  }

  /**
   * Refresh user token or log out
   */
  private refreshUserTokenOrLogOut(hideDialogsOnSuccess: boolean) {
    // don't allow spam :)
    if (
      this.lastRefreshUserTokenOrLogOut &&
      Math.floor(LocalizationHelper.now().diff(this.lastRefreshUserTokenOrLogOut) / 1000) < AuthenticatedComponent.REFRESH_DISABLE_SECONDS
    ) {
      // check again later
      this.tokenCheckIfLoggedOutCaller.call();

      // finished
      return;
    }

    // show loading
    this.showLoading();

    // retrieve the user instance
    this.lastRefreshUserTokenOrLogOut = LocalizationHelper.now();
    this.userDataService
      .getUser(this._authUser.id)
      .pipe(catchError((err) => {
        // log out
        this.authDataService
          .logout()
          .pipe(
            catchError(() => {
              // close dialogs
              if (this.confirmDialog) {
                this.confirmDialog.dismiss();
                this.confirmDialog = null;
              }

              // hide loading
              this.hideLoading();

              // finished
              this.prepareForRedirect();
              this.router.navigate(['/auth/login']);

              // error
              return throwError(err);
            })
          )
          .subscribe(() => {
            // close dialogs
            if (this.confirmDialog) {
              this.confirmDialog.dismiss();
              this.confirmDialog = null;
            }

            // hide loading
            this.hideLoading();

            // finished
            this.prepareForRedirect();
            this.router.navigate(['/auth/login']);
          });

        // finished
        return throwError(err);
      }))
      .subscribe(() => {
        // close dialogs
        if (hideDialogsOnSuccess) {
          if (this.confirmDialog) {
            this.confirmDialog.dismiss();
            this.confirmDialog = null;
          }
        }

        // hide loading
        this.hideLoading();

        // check again later
        this.tokenCheckIfLoggedOutCaller.call();
      });
  }

  /**
   * Disable dialogs before redirect
   */
  private prepareForRedirect() {
    // disable dialogs from showing
    ConfirmOnFormChanges.disableAllDirtyConfirm();

    // close dialogs in case any are visible
    // - IMPORTANT: no need to cancel timer on ngOnDestroy
    setTimeout(() => {
      PageChangeConfirmationGuard.closeVisibleDirtyDialog();
    });
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    this.renderMode = determineRenderMode();

    // do extra stuff depending of render mode
    if (this.renderMode !== RenderMode.FULL) {
      this.expandMenu = false;
    } else {
      // full
      this.hoveringMenu = false;
    }
  }
}
