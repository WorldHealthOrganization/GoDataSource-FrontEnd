import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { UserModel } from '../../models/user.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { PasswordChangeModel } from '../../models/password-change.model';
import { RequestQueryBuilder } from '../helper/request-query-builder';
import { SecurityQuestionModel } from '../../models/securityQuestion.model';

@Injectable()
export class UserDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Users
     * @returns {Observable<UserModel[]>}
     */
    getUsersList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<UserModel[]> {

        const qb = new RequestQueryBuilder();
        // include roles and permissions in response
        qb.include('roles');

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`users?filter=${filter}`),
            UserModel
        );
    }

    /**
     * Retrieve a User
     * @param {string} userId
     * @returns {Observable<UserRoleModel>}
     */
    getUser(userId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<UserModel> {

        const qb = new RequestQueryBuilder();
        // include roles and permissions in response
        qb.include('roles');

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableToModel(
            this.http.get(`users/${userId}?filter=${filter}`),
            UserModel
        );
    }

    /**
     * Create a new User
     * @param any user
     * @returns {Observable<UserModel[]>}
     */
    createUser(user): Observable<any> {
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

    /**
     * Send an e-mail with password reset instructions to user when he forgot his account password
     * @param data
     * @returns {Observable<Object>}
     */
    forgotPassword(data: any) {
        return this.http.post('users/reset', data);
    }

    /**
     * Reset user's password
     * @param data
     * @param token
     * @returns {Observable<Object>}
     */
    resetPassword(data: any, token: string) {
        return this.http.post(`users/reset-password?access_token=${token}`, data);
    }

    /**
     * Reset user's password using security questions
     * @param data
     * @returns {Observable<Object>}
     */
    resetPasswordQuestions(data: any) {
        return this.http.post(`users/reset-password-with-security-question`, data);
    }

    /**
     * Retrieve the list of available security questions
     * @returns {Observable<SecurityQuestionModel[]>}
     */
    getSecurityQuestionsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<SecurityQuestionModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`security-questions?filter=${filter}`),
            SecurityQuestionModel
        );
    }

}

