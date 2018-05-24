import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PasswordChangeModel } from '../../models/password-change.model';


@Injectable()
export class UserDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    getUser(userId) {

        // include role and permissions in response
        const includes = JSON.stringify({
            include: 'role'
        });

        return this.http.get(`users/${userId}?filter=${includes}`);
    }

    changePassword(data: PasswordChangeModel) {
        return this.http.post('users/change-password', data);
    }
}

