import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserRoleModel } from '../../models/user-role.model';
import { PermissionModel } from '../../models/permission.model';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';

@Injectable()
export class UserRoleDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
    }

    /**
     * Retrieve the list of User Roles
     * @returns {Observable<UserRoleModel[]>}
     */
    getRolesList(): Observable<UserRoleModel[]> {
        // get roles list from cache
        const rolesList = this.cacheService.get(CacheKey.AUTH_ROLES);
        if (rolesList) {
            return Observable.of(rolesList);
        } else {

            // firstly, retrieve available permissions so we can add them for each Role
            return this.getAvailablePermissions()
                .switchMap((availablePermissions: PermissionModel[]) => {

                    // get roles list from API
                    return this.modelHelper
                        .mapObservableListToModel(
                            this.http
                                .get('roles')
                                .map((rolesResult: any[]) => {
                                    // include available permissions on each Role object
                                    return _.map(rolesResult, (role) => {
                                        role.availablePermissions = availablePermissions;

                                        return role;
                                    });
                                }),
                            UserRoleModel
                        );
                })
                .do((roles) => {
                    // cache the list
                    this.cacheService.set(CacheKey.AUTH_ROLES, roles);
                });

        }
    }

    /**
     * Retrieve a User Role
     * @param {string} roleId
     * @returns {Observable<UserRoleModel>}
     */
    getRole(roleId: string): Observable<UserRoleModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`roles/${roleId}`),
            UserRoleModel
        );
    }

    /**
     * Create a new User Role
     * @param {UserRoleModel} userRole
     * @returns {Observable<UserRoleModel[]>}
     */
    createRole(userRole): Observable<any> {
        return this.http
            .post('roles', userRole)
            .do(() => {
                // invalidate the Roles List cache
                this.cacheService.remove(CacheKey.AUTH_ROLES);
            });
    }

    /**
     * Modify an existing User Role
     * @param {string} roleId
     * @returns {Observable<any>}
     */
    modifyRole(roleId: string, data: any): Observable<any> {
        return this.http
            .patch(`roles/${roleId}`, data)
            .do(() => {
                // invalidate the cache for Roles List
                this.cacheService.remove(CacheKey.AUTH_ROLES);
            });
    }

    /**
     * Delete an existing User Role
     * @param {string} roleId
     * @returns {Observable<any>}
     */
    deleteRole(roleId: string): Observable<any> {
        return this.http
            .delete(`roles/${roleId}`)
            .do(() => {
                // invalidate the cache for Roles List
                this.cacheService.remove(CacheKey.AUTH_ROLES);
            });
    }

    /**
     * Return the list of available permissions
     * @returns {Observable<string[]>}
     */
    getAvailablePermissions(): Observable<PermissionModel[]> {
        // get permissions list from cache
        const permissionsList = this.cacheService.get(CacheKey.PERMISSIONS);
        if (permissionsList) {
            return Observable.of(permissionsList);
        } else {
            // get permissions list from API
            return this.modelHelper
                .mapObservableListToModel(
                    this.http.get(`roles/available-permissions`),
                    PermissionModel
                )
                .do((permissions) => {
                    // cache the list
                    this.cacheService.set(CacheKey.PERMISSIONS, permissions);
                });
        }
    }
}

