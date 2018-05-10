import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import { ApiService } from './api.service';
import { StorageService, StorageKey } from '../helper/storage.service';
import { UserDataService } from './user.data.service';

import { AuthModel } from '../../models/auth.model';
import { UserModel } from '../../models/user.model';

@Injectable()
export class AuthDataService extends ApiService {

    constructor(
        private http: HttpClient,
        private storageService: StorageService,
        private userDataService: UserDataService
    ) {
        super(http);
    }

    login(user): Observable<any> {
        return this.post(`users/login`, user)
            .map((res) => {
                // keep auth info
                const auth = new AuthModel(res);

                // get user info
                return this.userDataService.getUser(auth.userId)
                    .subscribe((userData) => {
                        // keep user info
                        auth.user = new UserModel(userData);

                        // cache auth data
                        this.storageService.set(StorageKey.AUTH_DATA, JSON.stringify(auth));
                    });
            });
    }

    getAuthData(): AuthModel|null {
        try {
            // get auth data from cache
            const auth = <AuthModel>JSON.parse(this.storageService.get(StorageKey.AUTH_DATA));

            return auth;
        } catch (e) {
            return null;
        }
    }

    getAuthToken(): string|null {
        const authData = this.getAuthData();

        return _.get(authData, 'token');
    }

    getAuthenticatedUser(): UserModel|null {
        const authData = this.getAuthData();

        return _.get(authData, 'user');
    }
}

