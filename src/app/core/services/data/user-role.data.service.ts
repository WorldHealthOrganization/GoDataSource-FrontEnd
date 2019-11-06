import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserRoleModel } from '../../models/user-role.model';
import { PermissionModel } from '../../models/permission.model';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { map, share, switchMap, tap } from 'rxjs/operators';
import { I18nService } from '../helper/i18n.service';

@Injectable()
export class UserRoleDataService {

    userRoleList$: Observable<any>;
    availablePermissions$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService,
        private i18nService: I18nService
    ) {
        this.userRoleList$ = this.http.get('roles').pipe(share());
        this.availablePermissions$ = this.http
            .get(`roles/available-permissions`)
            .pipe(
                map((data: PermissionModel[]) => {
                    return (data || []).sort((item1: PermissionModel, item2: PermissionModel): number => {
                        return (item1.label ? this.i18nService.instant(item1.label) : '').localeCompare(item2.label ? this.i18nService.instant(item2.label) : '');
                    });
                }),
                share()
            );
    }

    /**
     * Retrieve the list of User Roles
     * @returns {Observable<UserRoleModel[]>}
     */
    getRolesList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<UserRoleModel[]> {
        // get roles list from cache
        const rolesList = this.cacheService.get(CacheKey.AUTH_ROLES);
        if (queryBuilder.isEmpty() && rolesList) {
            return of(rolesList);
        } else {

            let userRolesList$ = this.userRoleList$;
            if (!queryBuilder.isEmpty()) {
                const filter = queryBuilder.buildQuery();
                userRolesList$ = this.http.get(`roles?filter=${filter}`);
            }

            // firstly, retrieve available permissions so we can add them for each Role
            return this.getAvailablePermissions()
                .pipe(
                    switchMap((availablePermissions: PermissionModel[]) => {
                        // get roles list from API
                        return this.modelHelper
                            .mapObservableListToModel(
                                userRolesList$
                                    .pipe(
                                        map((rolesResult: any[]) => {
                                            // include available permissions on each Role object
                                            return _.map(rolesResult, (role) => {
                                                role.availablePermissions = availablePermissions;

                                                return role;
                                            });
                                        })
                                    ),
                                UserRoleModel
                            );
                    }),
                    tap((roles) => {
                        // cache the list
                        if (queryBuilder.isEmpty()) {
                            this.cacheService.set(CacheKey.AUTH_ROLES, roles);
                        }
                    })
                );

        }
    }

    /**
     * Return total number of user roles
     * @returns {Observable<any>}
     */
    getRolesCount(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`roles/count?where=${whereFilter}`);
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
            .pipe(
                tap(() => {
                    // invalidate the Roles List cache
                    this.cacheService.remove(CacheKey.AUTH_ROLES);
                })
            );
    }

    /**
     * Modify an existing User Role
     * @param {string} roleId
     * @param data
     * @returns {Observable<UserRoleModel>}
     */
    modifyRole(roleId: string, data: any): Observable<UserRoleModel> {
        return this.modelHelper.mapObservableToModel(
            this.http
                .patch(`roles/${roleId}`, data)
                .pipe(
                    tap(() => {
                        // invalidate the cache for Roles List
                        this.cacheService.remove(CacheKey.AUTH_ROLES);
                    })
                ),
            UserRoleModel
        );
    }

    /**
     * Delete an existing User Role
     * @param {string} roleId
     * @returns {Observable<any>}
     */
    deleteRole(roleId: string): Observable<any> {
        return this.http
            .delete(`roles/${roleId}`)
            .pipe(
                tap(() => {
                    // invalidate the cache for Roles List
                    this.cacheService.remove(CacheKey.AUTH_ROLES);
                })
            );
    }

    /**
     * Return the list of available permissions
     * @returns {Observable<string[]>}
     */
    getAvailablePermissions(): Observable<PermissionModel[]> {
        // get permissions list from cache
        const permissionsList = this.cacheService.get(CacheKey.PERMISSIONS);
        if (permissionsList) {
            return of(permissionsList);
        } else {
            // get permissions list from API
            return this.modelHelper
                .mapObservableListToModel(
                    this.availablePermissions$,
                    PermissionModel
                )
                .pipe(
                    tap((permissions) => {
                        // cache the list
                        this.cacheService.set(CacheKey.PERMISSIONS, permissions);
                    })
                );
        }
    }
}

