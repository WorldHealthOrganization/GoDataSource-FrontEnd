import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { MatDialogRef, MatSidenav } from '@angular/material';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../services/data/reference-data.data.service';
import { HelpDataService } from '../../services/data/help.data.service';
import * as _ from 'lodash';
import { Constants } from '../../models/constants';
import { DialogButton, DialogComponent, DialogConfiguration, LoadingDialogModel, ViewHelpData, ViewHelpDialogComponent } from '../../../shared/components';
import { DialogService } from '../../services/helper/dialog.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs/internal/Subscription';
import { UserDataService } from '../../services/data/user.data.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { DebounceTimeCaller, DebounceTimeCallerType } from '../../helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/internal-compatibility';
import { ITokenInfo } from '../../models/auth.model';
import { Moment } from 'moment';
import * as moment from 'moment';
import { ConfirmOnFormChanges, PageChangeConfirmationGuard } from '../../services/guards/page-change-confirmation-guard.service';
import { DashboardModel } from '../../models/dashboard.model';

@Component({
    selector: 'app-authenticated',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './authenticated.component.html',
    styleUrls: ['./authenticated.component.less']
})
export class AuthenticatedComponent implements OnInit, OnDestroy {
    // display popup when less then 2 minutes
    static NO_ACTIVITY_POPUP_SHOULD_REDIRECT_IF_LESS_THAN_SECONDS = -5;
    static NO_ACTIVITY_POPUP_SHOULD_APPEAR_WHEN_LESS_THAN_SECONDS = 120;
    static NO_ACTIVITY_POPUP_SHOULD_REFRESH_TOKEN_IF_USER_ACTIVE = 240;
    static REFRESH_IF_USER_WAS_ACTIVE_IN_THE_LAST_SECONDS = 20;
    static REFRESH_DISABLE_SECONDS = 7;

    // slide nav menu
    @ViewChild('snav') sideNav: MatSidenav;

    // authenticated user
    authUser: UserModel;

    // debug visible ?
    debugVisible: boolean = !environment.production;

    // used to keep subscription and release it if we don't need it anymore
    tokenInfoSubjectSubscription: Subscription;

    // router events subscription
    routerEventsSubscriptionLoad: Subscription;
    routerEventsSubscriptionRepetitive: Subscription;

    // help items for search
    contextSearchHelpItems: string[];

    // constants
    Constants = Constants;

    // menu loading dialog
    private menuLoadingDialog: LoadingDialogModel;

    // token expire data
    private lastRefreshUserTokenOrLogOut: Moment;
    private lastInputTime: Moment;
    private loadingDialog: LoadingDialogModel;
    private confirmDialog: MatDialogRef<DialogComponent>;
    private tokenInfo: ITokenInfo;
    private tokenExpirePopupIsVisible: boolean = false;
    private documentKeyUp: () => void;
    private documentMouseMove: () => void;
    private tokenCheckIfLoggedOutCaller: DebounceTimeCaller = new DebounceTimeCaller(
        new Subscriber<void>(() => {
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
                    Math.floor(moment().diff(this.lastInputTime) / 1000) < AuthenticatedComponent.REFRESH_IF_USER_WAS_ACTIVE_IN_THE_LAST_SECONDS
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
        }),
        800,
        DebounceTimeCallerType.DONT_RESET_AND_WAIT
    );

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private helpDataService: HelpDataService,
        private dialogService: DialogService,
        private userDataService: UserDataService
    ) {
        // detect when the route is changed
        this.routerEventsSubscriptionLoad = this.router.events.subscribe((event) => {
            // display loading spinner
            if (event instanceof RouteConfigLoadStart) {
                this.showLoading();
            } else if (event instanceof RouteConfigLoadEnd) {
                this.hideLoading();
            }

            // there is no point in continuing if not a nav start event since we need to execute close only one time
            if (!(event instanceof NavigationStart)) {
                return;
            }

            // close the SideNav whenever the route is changed
            if (this.sideNav) {
                this.sideNav.close();
            }
        });
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // check if user is authenticated
        if (!this.authUser) {
            // user is NOT authenticated; redirect to Login page
            this.prepareForRedirect();
            return this.router.navigate(['/auth/login']);
        }

        // handle auth token expire popup
        this.initializeTokenExpireHandler();

        // determine the Selected Outbreak and display message if different than the active one.
        if (OutbreakModel.canView(this.authUser)) {
            this.outbreakDataService
                .determineSelectedOutbreak()
                .subscribe(() => {
                    this.outbreakDataService.getSelectedOutbreakSubject()
                        .subscribe(() => {
                            this.outbreakDataService.checkActiveSelectedOutbreak();
                        });
                });
        }

        // cache reference data
        this.referenceDataDataService.getReferenceData().subscribe();

        // redirect root to landing page
        const redirectRootToLandingPage = () => {
            // determine to which page we should send this user
            // #TODO - accordingly to user DEFAULT landing page and PERMISSIONS

            // redirect to default landing page
            if (DashboardModel.canViewDashboard(this.authUser)) {
                this.router.navigate(['/dashboard']);
            } else {
                this.router.navigate(['/version']);
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

            // check for context help
            if (
                this.router.url &&
                this.router.url !== '/'
            ) {
                this.helpDataService.getContextHelpItems(this.router.url)
                    .subscribe((items) => {
                        if (_.isEmpty(items)) {
                            this.contextSearchHelpItems = null;
                        } else {
                            this.contextSearchHelpItems = _.map(items, 'id');
                        }
                    });
            }
        });

        // redirect root to landing page
        if (this.router.url === '/') {
            return redirectRootToLandingPage();
        }

        //  help items
        this.helpDataService.getContextHelpItems(this.router.url)
            .subscribe((items) => {
                if (_.isEmpty(items)) {
                    this.contextSearchHelpItems = null;
                } else {
                    this.contextSearchHelpItems = _.map(items, 'id');
                }
            });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy(): void {
        // hide loading in case it is still visible
        this.hideLoading();

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
        if (this.routerEventsSubscriptionLoad) {
            this.routerEventsSubscriptionLoad.unsubscribe();
            this.routerEventsSubscriptionLoad = null;
        }

        // release
        if (this.routerEventsSubscriptionRepetitive) {
            this.routerEventsSubscriptionRepetitive.unsubscribe();
            this.routerEventsSubscriptionRepetitive = null;
        }

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
        this.menuLoadingDialog = this.dialogService.showLoadingDialog();
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
     * Display help dialog
     */
    displayHelpDialog() {
        this.dialogService.showCustomDialog(
            ViewHelpDialogComponent,
            {
                ...ViewHelpDialogComponent.DEFAULT_CONFIG,
                ...{
                    data: new ViewHelpData({
                        helpItemsIds: this.contextSearchHelpItems
                    })
                }
            }
        );
    }

    /**
     * Refresh last input time
     */
    private refreshLastInputTime() {
        if (!this.lastInputTime) {
            this.lastInputTime = moment();
        } else if (moment().diff(this.lastInputTime) / 1000 > 3) {
            this.lastInputTime = moment();
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
                        // popup visible
                        this.tokenExpirePopupIsVisible = true;
                        setTimeout(() => {
                            // display popup
                            this.confirmDialog = this.dialogService
                                .showConfirmDialog(
                                    new DialogConfiguration({
                                        message: 'LNG_AUTHENTICATION_TOKEN_EXPIRE_DIALOG_TITLE',
                                        buttons: [
                                            new DialogButton({
                                                label: 'LNG_AUTHENTICATION_TOKEN_EXPIRE_DIALOG_CONTINUE_BUTTON',
                                                clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                                    // show loading
                                                    this.loadingDialog = this.dialogService.showLoadingDialog();

                                                    // retrieve the user instance
                                                    this.userDataService
                                                        .getUser(this.authUser.id)
                                                        .pipe(catchError((err) => {
                                                            // log out
                                                            this.authDataService
                                                                .logout()
                                                                .pipe(
                                                                    catchError(() => {
                                                                        this.prepareForRedirect();
                                                                        this.router.navigate(['/auth/login']);
                                                                        dialogHandler.close();
                                                                        this.loadingDialog.close();
                                                                        this.loadingDialog = null;
                                                                        return throwError(err);
                                                                    })
                                                                )
                                                                .subscribe(() => {
                                                                    this.prepareForRedirect();
                                                                    this.router.navigate(['/auth/login']);
                                                                    dialogHandler.close();
                                                                    this.loadingDialog.close();
                                                                    this.loadingDialog = null;
                                                                });

                                                            // finished
                                                            return throwError(err);
                                                        }))
                                                        .subscribe(() => {
                                                            // still logged in
                                                            // continue
                                                            dialogHandler.close();
                                                            this.loadingDialog.close();
                                                            this.loadingDialog = null;
                                                        });
                                                }
                                            })
                                        ]
                                    })
                                );

                            // show dialog
                            this.confirmDialog
                                .afterClosed()
                                .subscribe((answer) => {
                                    // popup closed
                                    this.tokenExpirePopupIsVisible = false;
                                    this.confirmDialog = null;
                                });
                        });

                    }
                }
            });
    }

    /**
     * Refresh user token or log out
     */
    private refreshUserTokenOrLogOut(
        hideDialogsOnSuccess: boolean
    ) {
        // don't allow spam :)
        if (
            this.lastRefreshUserTokenOrLogOut &&
            Math.floor(moment().diff(this.lastRefreshUserTokenOrLogOut) / 1000) < AuthenticatedComponent.REFRESH_DISABLE_SECONDS
        ) {
            // check again later
            this.tokenCheckIfLoggedOutCaller.call();

            // finished
            return;
        }

        // retrieve the user instance
        this.lastRefreshUserTokenOrLogOut = moment();
        this.userDataService
            .getUser(this.authUser.id)
            .pipe(catchError((err) => {
                // log out
                this.authDataService
                    .logout()
                    .pipe(
                        catchError(() => {
                            // close dialogs
                            if (this.confirmDialog) {
                                this.confirmDialog.close();
                                this.confirmDialog = null;
                            }
                            if (this.loadingDialog) {
                                this.loadingDialog.close();
                                this.loadingDialog = null;
                            }

                            // finished
                            this.prepareForRedirect();
                            this.router.navigate(['/auth/login']);
                            return throwError(err);
                        })
                    )
                    .subscribe(() => {
                        // close dialogs
                        if (this.confirmDialog) {
                            this.confirmDialog.close();
                            this.confirmDialog = null;
                        }
                        if (this.loadingDialog) {
                            this.loadingDialog.close();
                            this.loadingDialog = null;
                        }

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
                        this.confirmDialog.close();
                        this.confirmDialog = null;
                    }
                    if (this.loadingDialog) {
                        this.loadingDialog.close();
                        this.loadingDialog = null;
                    }
                }

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
        setTimeout(() => {
            PageChangeConfirmationGuard.closeVisibleDirtyDialog();
        });
    }
}
