import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { StorageKey, StorageService } from '../helper/storage.service';
import { UserDataService } from './user.data.service';
import { AuthModel, ITokenInfo } from '../../models/auth.model';
import { UserModel, UserSettings } from '../../models/user.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { Moment } from 'moment';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { DebounceTimeCaller, DebounceTimeCallerType } from '../../helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/internal-compatibility';
import { SystemSettingsDataService } from './system-settings.data.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class AuthDataService {
    // frequency to call subscribers
    static readonly TOKEN_INFO_CALL_FREQUENCY_SECONDS = environment.production ? 3 : 1;

    // token info subscriber
    private lastTokenInfoCalledSubscribers: Moment;
    private tokenInfoSubscriberSubject: BehaviorSubject<ITokenInfo> = new BehaviorSubject<ITokenInfo>(null);
    private tokenInfoSubscriberSubjectCaller: DebounceTimeCaller = new DebounceTimeCaller(
        new Subscriber<void>(() => {
            // call token info subscribers
            this.determineTokenInfo();

            // call again
            this.tokenInfoSubscriberSubjectCaller.call();
        }),
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
     * @param user
     * @returns {Observable<any>}
     */
    login(user): Observable<AuthModel> {
        return this.http.post(`users/login`, user)
            .pipe(
                switchMap((authRes) => {
                    // keep auth info
                    const auth = this.modelHelperService.getModelInstance(AuthModel, authRes);

                    // cache auth data so the Auth Token will be added on the next request
                    this.storageService.set(StorageKey.AUTH_DATA, auth);

                    // get user info
                    return this.userDataService.getUser(auth.userId)
                        .pipe(
                            map((userInstance: UserModel) => {
                                // keep user info
                                auth.user = userInstance;

                                // cache auth data with authenticated user information
                                this.storageService.set(StorageKey.AUTH_DATA, auth);

                                // initialize auth info
                                this.initializeTokenInfo();

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
                map((userInstance: UserModel) => {
                    // keep user info
                    authData.user = userInstance;

                    // cache auth data with authenticated user information
                    this.storageService.set(StorageKey.AUTH_DATA, authData);

                    // initialize auth info
                    this.updateTokenInfo();

                    // finished
                    return authData;
                })
            );
    }

    /**
     * Update settings for current user
     * @param settingsKey
     * @param data
     * @returns {Observable<any>}
     */
    updateSettingsForCurrentUser(
        settingsKey: UserSettings,
        data: any
    ): Observable<any> {
        // save user settings to database
        const authUser = this.getAuthenticatedUser();
        return this.userDataService
            .updateSettings(
                authUser.id,
                settingsKey,
                data
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
     * @returns {Observable<any>}
     */
    logout(): Observable<any> {
        return this.http.post(`users/logout`, null)
            .pipe(
                tap(() => {
                    // clear token info
                    this.destroyTokenInfo();

                    // remove auth info from local storage
                    this.storageService.remove(StorageKey.AUTH_DATA);

                    // remove selected outbreak from local storage
                    this.storageService.remove(StorageKey.SELECTED_OUTBREAK_ID);
                })
            );
    }

    /**
     * Get Authentication Data from local storage (if user is authenticated)
     * @returns {AuthModel | null}
     */
    getAuthData(): AuthModel|null {
        try {
            // get auth data from cache
            return <AuthModel>this.storageService.get(StorageKey.AUTH_DATA);
        } catch (e) {
            return null;
        }
    }

    /**
     * Get the API Authentication Token from local storage (if user is authenticated)
     * @returns {string | null}
     */
    getAuthToken(): string|null {
        const authData = this.getAuthData();
        return _.get(authData, 'token');
    }

    /**
     * Get the authenticated User from local storage (if user is authenticated)
     * @returns {UserModel | null}
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
     * @returns {boolean}
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
    private initializeTokenInfo(defaultTTL: number = -1) {
        // release previous
        this.destroyTokenInfo();

        // we must be authenticated to initialize
        const authToken = this.getAuthToken();
        if (!authToken) {
            return;
        }

        // check if we have ttl time, otherwise retrieve it
        if (defaultTTL === -1) {
            this.systemSettingsDataService
                .getAPIVersionNoCache()
                .subscribe((data) => {
                    // update token info
                    if (this.tokenInfo) {
                        // update default time to live
                        this.tokenInfo.ttl = data.tokenTTL;

                        // determine info
                        this.resetTokenInfo();
                    }
                });
        }

        // initialize token into
        this.tokenInfo = {
            token: authToken,
            ttl: defaultTTL,
            lastReset: moment(),
            info: {
                ttl: defaultTTL,
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
    private updateTokenInfo() {
        // initialize token info if we need to
        if (!this.tokenInfo) {
            this.initializeTokenInfo();
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
        const passedSecondsSinceCreation: number = Math.floor(moment().diff(this.tokenInfo.lastReset) / 1000);

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
            Math.floor(moment().diff(this.lastTokenInfoCalledSubscribers) / 1000) <= AuthDataService.TOKEN_INFO_CALL_FREQUENCY_SECONDS
        ) {
            return;
        }

        // call subscribers
        this.tokenInfoSubscriberSubject.next(this.tokenInfo.info);

        // update last call time
        this.lastTokenInfoCalledSubscribers = moment();
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
        this.tokenInfo.lastReset = moment();

        // do the math
        this.determineTokenInfo();
    }

    /**
     * Subject handler
     */
    public getTokenInfoSubject(): BehaviorSubject<ITokenInfo> {
        return this.tokenInfoSubscriberSubject;
    }
}
