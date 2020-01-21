import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { StorageService, StorageKey } from '../helper/storage.service';
import { UserDataService } from './user.data.service';
import { AuthModel } from '../../models/auth.model';
import { UserModel, UserSettings } from '../../models/user.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class AuthDataService {

    constructor(
        private http: HttpClient,
        private storageService: StorageService,
        private userDataService: UserDataService,
        private modelHelperService: ModelHelperService
    ) {
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

}

