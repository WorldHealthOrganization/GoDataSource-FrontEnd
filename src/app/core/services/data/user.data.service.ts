import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../../models/user.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { PasswordChangeModel } from '../../models/password-change.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { SecurityQuestionModel } from '../../models/securityQuestion.model';
import * as _ from 'lodash';
import { mergeMap } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class UserDataService {

  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list of Users
   */
  getUsersList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<UserModel[]> {
    // include roles and permissions in response
    const qb = new RequestQueryBuilder();
    qb.include('roles', true);
    qb.merge(queryBuilder);

    const filter = qb.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`users?filter=${filter}`),
      UserModel
    );
  }

  /**
   * Retrieve the list of users with limited information
   */
  getUsersListForFilters(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<UserModel[]> {
    // include roles and permissions in response
    const where = queryBuilder.filter.generateCondition(true);
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`users/for-filters?where=${where}`),
      UserModel
    );
  }

  /**
     * Return total number of users
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getUsersCount(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`users/count?where=${whereFilter}`);
  }

  /**
     * Retrieve a User
     * @param {string} userId
     * @param queryBuilder
     * @returns {Observable<UserRoleModel>}
     */
  getUser(
    userId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<UserModel> {
    const qb = new RequestQueryBuilder();
    // include roles and permissions in response
    qb.include('roles', true);

    qb.merge(queryBuilder);

    const filter = qb.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`users/${userId}?filter=${filter}`),
      UserModel
    );
  }

  /**
     * Create a new User
     * @param user
     * @returns {Observable<UserModel[]>}
     */
  createUser(user): Observable<any> {
    return this.http.post('users', user);
  }

  /**
     * Modify an existing UserRole
     * @param {string} userId
     * @param data
     * @returns {Observable<UserModel>}
     */
  modifyUser(userId: string, data: any): Observable<UserModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.patch(`users/${userId}`, data),
      UserModel
    );
  }

  /**
   * Update user settings
   */
  updateSettings(
    userId: string,
    settings: {
      [settingsKey: string]: any
    }
  ): Observable<any> {
    return this.getUser(userId)
      .pipe(
        mergeMap((userData) => {
          // construct new settings
          _.each(settings, (data, settingsKey) => {
            _.set(
              userData.settings,
              settingsKey,
              data
            );
          });

          // save settings
          return this.modifyUser(userId, { settings: userData.settings });
        })
      );
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
    return this.http.post(
      'users/reset',
      data
    );
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
    return this.http.post(
      'users/reset-password-with-security-question',
      data
    );
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

