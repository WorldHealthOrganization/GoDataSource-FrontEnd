import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { UserModel } from '../../models/user.model';
import { ObservableHelperService } from '../helper/observable-helper.service';
import { PasswordChangeModel } from '../../models/password-change.model';


@Injectable()
export class UserDataService {

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService
    ) {
    }

    /**
     * Retrieve the list of Users
     * @returns {Observable<UserModel[]>}
     */
    getUsersList(): Observable<UserModel[]> {

        // include role and permissions in response
        const includes = JSON.stringify({
            include: 'role'
        });

        return this.observableHelper.mapListToModel(
            this.http.get(`users?filter=${includes}`),
            UserModel
        );
    }

    /**
     * Retrieve a User
     * @param {string} userId
     * @returns {Observable<UserRoleModel>}
     */
    getUser(userId: string): Observable<UserModel> {

        // include role and permissions in response
        const includes = JSON.stringify({
            include: 'role'
        });

        return this.observableHelper.mapToModel(
            this.http.get(`users/${userId}?filter=${includes}`),
            UserModel
        );
    }

    /**
     * Create a new User
     * @param {UserModel} user
     * @returns {Observable<UserModel[]>}
     */
    createUser(user: UserModel): Observable<any> {
        return this.http.post('users', user);
    }

    /**
     * Modify an existing UserRole
     * @param {string} userId
     * @returns {Observable<any>}
     */
    modifyUser(userId: string, data: any): Observable<any> {
        return this.http.patch(`users/${userId}`, data);
    }

    /**
     * Delete an existing User
     * @param {string} userId
     * @returns {Observable<any>}
     */
    deleteUser(userId: string): Observable<any> {
        return this.http.delete(`users/${userId}`);
    }

    /**
     * Change current user's password
     * @param {PasswordChangeModel} data
     * @returns {Observable<Object>}
     */
    changePassword(data: PasswordChangeModel) {
        return this.http.post('users/change-password', data);
    }

}

