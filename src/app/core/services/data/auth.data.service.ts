import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import * as _ from 'lodash';
import { StorageKey, StorageService } from '../helper/storage.service';
import { UserDataService } from './user.data.service';
import { AuthModel, IAuthTwoFactor, ITokenInfo } from '../../models/auth.model';
import { UserModel } from '../../models/user.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { DebounceTimeCaller, DebounceTimeCallerType } from '../../helperClasses/debounce-time-caller';
import { SystemSettingsDataService } from './system-settings.data.service';
import { environment } from '../../../../environments/environment';
import { LocalizationHelper, Moment } from '../../helperClasses/localization-helper';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';

@Injectable()
export class AuthDataService {
  // frequency to call subscribers
  static readonly TOKEN_INFO_CALL_FREQUENCY_SECONDS = environment.production ? 3 : 1;

  // token info subscriber
  private lastTokenInfoCalledSubscribers: Moment;
  private tokenInfoSubscriberSubject: BehaviorSubject<ITokenInfo> = new BehaviorSubject<ITokenInfo>(null);
  private tokenInfoSubscriberSubjectCaller: DebounceTimeCaller = new DebounceTimeCaller(
    () => {
      // call token info subscribers
      this.determineTokenInfo();

      // call again
      this.tokenInfoSubscriberSubjectCaller.call();
    },
    AuthDataService.TOKEN_INFO_CALL_FREQUENCY_SECONDS * 100 / 2,
    DebounceTimeCallerType.DONT_RESET_AND_WAIT
  );

  // token info
  private tokenInfo: {
    token: string,
    ttl: number,
    lastReset: Moment,
    info: ITokenInfo
  };

  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private userDataService: UserDataService,
    private modelHelperService: ModelHelperService,
    private systemSettingsDataService: SystemSettingsDataService
  ) {
    // initial again
    this.tokenInfoSubscriberSubjectCaller.call();
  }

  /**
   * Authenticate with email and password
   */
  login(
    user,
    twoFA?: boolean
  ): Observable<AuthModel> {
    return this.http
      .post(
        twoFA ? 'users/two-factor-authentication-step-2' : 'users/login',
        user
      )
      .pipe(
        switchMap((authRes: IAuthTwoFactor | AuthModel) => {
          // must enter code ?
          if ((authRes as IAuthTwoFactor).twoFA) {
            // expecting code before we can continue
            return of(authRes);
          }

          // keep auth info
          const auth = this.modelHelperService.getModelInstance(AuthModel, authRes);

          // cache auth data so the Auth Token will be added on the next request
          this.storageService.set(StorageKey.AUTH_DATA, auth);

          // get user info
          return this.userDataService.getUser(auth.userId)
            .pipe(
              switchMap((userInstance) => {
                return this.systemSettingsDataService.getAPIVersionNoCache()
                  .pipe(map((conf) => {
                    return {
                      user: userInstance,
                      conf
                    };
                  }));
              }),
              map((data: {
                user: UserModel,
                conf: SystemSettingsVersionModel
              }) => {
                // keep user info
                auth.user = data.user;

                // cache auth data with authenticated user information
                this.storageService.set(StorageKey.AUTH_DATA, auth);

                // initialize auth info
                this.initializeTokenInfo(data.conf.tokenTTL);

                // finished
                return auth;
              })
            );
        })
      );
  }

  /**
   * Reload user settings
   */
  reloadAndPersistAuthUser(): Observable<AuthModel> {
    // refresh logic data
    const authData = this.getAuthData();
    const userId = _.get(authData, 'user.id', '');

    // get user info
    return this.userDataService.getUser(userId)
      .pipe(
        switchMap((userInstance) => {
          return this.systemSettingsDataService.getAPIVersionNoCache()
            .pipe(map((conf) => {
              return {
                user: userInstance,
                conf
              };
            }));
        }),
        map((data: {
          user: UserModel,
          conf: SystemSettingsVersionModel
        }) => {
          // keep user info
          authData.user = data.user;

          // cache auth data with authenticated user information
          this.storageService.set(StorageKey.AUTH_DATA, authData);

          // initialize auth info
          this.updateTokenInfo(data.conf.tokenTTL);

          // finished
          return authData;
        })
      );
  }

  /**
   * Update settings for current user
   */
  updateSettingsForCurrentUser(
    settings: {
      [settingsKey: string]: any
    }
  ): Observable<any> {
    // save user settings to database
    const authUser = this.getAuthenticatedUser();
    return this.userDataService
      .updateSettings(
        authUser.id,
        settings
      )
      .pipe(
        mergeMap(() => {
          // update user data in local storage
          return this.reloadAndPersistAuthUser();
        })
      );
  }

  /**
   * Logout from API
   */
  logout(): Observable<any> {
    return this.http
      .post('users/logout', null)
      .pipe(
        tap(() => {
          // clear token info
          this.clearStorage();
        })
      );
  }

  /**
   * Get Authentication Data from local storage (if user is authenticated)
   */
  getAuthData(): AuthModel | null {
    try {
      // get auth data from cache
      return <AuthModel>this.storageService.get(StorageKey.AUTH_DATA);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get the API Authentication Token from local storage (if user is authenticated)
   */
  getAuthToken(): string | null {
    const authData = this.getAuthData();
    return _.get(authData, 'token');
  }

  /**
   * Get the authenticated User from local storage (if user is authenticated)
   */
  getAuthenticatedUser(): UserModel {
    const authData = this.getAuthData();

    if (authData) {
      return this.modelHelperService.getModelInstance(UserModel, _.get(authData, 'user'));
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    // get authenticated user
    const user = this.getAuthenticatedUser();
    return !!user;
  }

  /**
   * Release resources
   */
  private destroyTokenInfo() {
    // nothing to do ?
    if (!this.tokenInfo) {
      return;
    }

    // release
    this.tokenInfo = null;
  }

  /**
   * Initialize token information - time to live etc
   */
  private initializeTokenInfo(tokenTTL: number) {
    // release previous
    this.destroyTokenInfo();

    // we must be authenticated to initialize
    const authToken = this.getAuthToken();
    if (!authToken) {
      return;
    }

    // initialize token into
    this.tokenInfo = {
      token: authToken,
      ttl: tokenTTL,
      lastReset: LocalizationHelper.now(),
      info: {
        ttl: tokenTTL,
        isValid: false,
        approximatedExpireInSeconds: -1,
        approximatedExpireInSecondsReal: -1
      }
    };

    // determine info
    this.resetTokenInfo();
  }

  /**
   * Update token information
   */
  private updateTokenInfo(tokenTTL: number) {
    // initialize token info if we need to
    if (!this.tokenInfo) {
      this.initializeTokenInfo(tokenTTL);
    }

    // we must be authenticated to update
    const authToken = this.getAuthToken();
    if (!authToken) {
      // release since we aren't logged anymore
      this.destroyTokenInfo();

      // finished
      return;
    }

    // update
    this.tokenInfo.token = authToken;

    // determine info
    this.resetTokenInfo();
  }

  /**
     * Determine token info
     */
  private determineTokenInfo() {
    // token info must be initialized, otherwise there is nothing to do here
    if (!this.tokenInfo) {
      return;
    }

    // determine number of seconds passed since we last made a request to api that should've reset the token ttl
    const passedSecondsSinceCreation: number = Math.floor(LocalizationHelper.now().diff(this.tokenInfo.lastReset) / 1000);

    // determine approximate remaining seconds
    if (this.tokenInfo.ttl > 0) {
      // determine remaining seconds
      this.tokenInfo.info.approximatedExpireInSecondsReal = this.tokenInfo.ttl - passedSecondsSinceCreation;

      // format data
      this.tokenInfo.info.approximatedExpireInSeconds = this.tokenInfo.info.approximatedExpireInSecondsReal < 0 ?
        0 :
        this.tokenInfo.info.approximatedExpireInSecondsReal;
    } else {
      // no ttl time defined, nothing to expire
      this.tokenInfo.info.approximatedExpireInSecondsReal = -1;
      this.tokenInfo.info.approximatedExpireInSeconds = -1;
    }

    // update ttl info
    this.tokenInfo.info.ttl = this.tokenInfo.ttl;

    // determine if token is still valid
    this.tokenInfo.info.isValid = this.tokenInfo.info.approximatedExpireInSeconds === -1 || this.tokenInfo.info.approximatedExpireInSeconds > 0;

    // call subscribers
    this.callTokenInfoSubscribers();
  }

  /**
     * Call token info subscribers if necessary
     */
  private callTokenInfoSubscribers() {
    // check if the minimum number of seconds have passed since our last call
    if (
      this.lastTokenInfoCalledSubscribers &&
            Math.floor(LocalizationHelper.now().diff(this.lastTokenInfoCalledSubscribers) / 1000) <= AuthDataService.TOKEN_INFO_CALL_FREQUENCY_SECONDS
    ) {
      return;
    }

    // call subscribers
    this.tokenInfoSubscriberSubject.next(this.tokenInfo.info);

    // update last call time
    this.lastTokenInfoCalledSubscribers = LocalizationHelper.now();
  }

  /**
     * Reset token info
     */
  public resetTokenInfo() {
    // do we have anything to reset ?
    if (!this.tokenInfo) {
      return;
    }

    // reset token time
    this.tokenInfo.lastReset = LocalizationHelper.now();

    // do the math
    this.determineTokenInfo();
  }

  /**
   * Subject handler
   */
  public getTokenInfoSubject(): BehaviorSubject<ITokenInfo> {
    return this.tokenInfoSubscriberSubject;
  }

  /**
     * Remove all data from storage that is handled by this service
     */
  public clearStorage() {
    // clear token info
    this.destroyTokenInfo();

    // remove auth info from local storage
    this.storageService.remove(StorageKey.AUTH_DATA);

    // remove selected outbreak from local storage
    this.storageService.remove(StorageKey.SELECTED_OUTBREAK_ID);

    // remove remember filters
    this.storageService.remove(StorageKey.FILTERS);
  }
}
