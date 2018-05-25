import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import * as _ from 'lodash';

import { StorageService, StorageKey } from '../helper/storage.service';
import { UserDataService } from './user.data.service';

import { AuthModel } from '../../models/auth.model';
import { UserModel } from '../../models/user.model';

@Injectable()
export class AuthDataService {

    constructor(
        private http: HttpClient,
        private storageService: StorageService,
        private userDataService: UserDataService
    ) {
    }

    /**
     * Authenticate with email and password
     * @param user
     * @returns {Observable<any>}
     */
    login(user): Observable<AuthModel> {
        return this.http.post(`users/login`, user)
            .mergeMap((authRes) => {
                // keep auth info
                const auth = new AuthModel(authRes);

                // cache auth data so the Auth Token will be added on the next request
                this.storageService.set(StorageKey.AUTH_DATA, auth);

                // get user info
                return this.userDataService.getUser(auth.userId)
                    .map((userInstance: UserModel) => {
                        // keep user info
                        auth.user = userInstance;

                        // cache auth data with authenticated user information
                        this.storageService.set(StorageKey.AUTH_DATA, auth);

                        return auth;
                    });
            });
    }

    /**
     * Logout from API
     * @returns {Observable<any>}
     */
    logout(): Observable<any> {
        return this.http.post(`users/logout`, null)
            .do((res) => {
                // remove auth info from local storage
                this.storageService.remove(StorageKey.AUTH_DATA);
            });
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
            return new UserModel(_.get(authData, 'user'));
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

