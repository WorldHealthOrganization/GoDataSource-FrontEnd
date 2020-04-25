import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserModel, UserRoleModel } from '../../models/user.model';
import { IPermissionChildModel, PERMISSION, PermissionModel } from '../../models/permission.model';
import * as _ from 'lodash';
import { TeamModel } from '../../models/team.model';
import { LocationModel } from '../../models/location.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { MetricCasesPerLocationCountsModel } from '../../models/metrics/metric-cases-per-location-counts.model';
import { MetricLocationCasesCountsModel } from '../../models/metrics/metric-location-cases-count.model';
import { map } from 'rxjs/operators';

@Injectable()
export class ModelHelperService {

    /**
     * Transform an observable's response from a list of objects to a list of model instances
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for each item in the list
     * @returns {Observable<any[]>}
     */
    mapObservableListToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs
            .pipe(
                map((listResult) => {
                    return listResult.map((item) => {
                        return this.getModelInstance(modelClass, item);
                    });
                })
            );
    }

    /**
     * Transform an observable's response from an object to an instance of a model
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for the retrieved item
     * @returns {Observable<any>}
     */
    mapObservableToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs
            .pipe(
                map((itemResult) => {
                    return this.getModelInstance(modelClass, itemResult);
                })
            );
    }

    /**
     * Transform a list of objects to a list of model instances
     * @param {any[]} list
     * @param modelClass The Model Class to be instantiated for each item in the list
     * @returns {any[]}
     */
    mapListToModel(list: any[], modelClass) {
        return list.map((item) => {
            return this.getModelInstance(modelClass, item);
        });
    }

    /**
     * Create an instance of a given model from a given data object
     * @param modelClass The Model Class to be instantiated
     * @param data Data to be passed to Model Class' constructor
     * @returns {any}
     */
    getModelInstance(modelClass, data: any) {
        switch (modelClass) {
            // custom instantiation routine for User model
            case UserModel:
                // create the User instance
                const user = new UserModel(data);

                // set User Roles
                user.roles = this.mapListToModel(
                    _.get(data, 'roles', []),
                    UserRoleModel
                );

                // collect all User permissions from its assigned Roles
                const rolesPermissions: any = _.map(user.roles, (role) => {
                    return role.permissionIds;
                });
                const permissionIdsFromRoles = _.flatten(rolesPermissions) as PERMISSION[];

                // keep only unique permissions
                let finalUserPermissions: PERMISSION[] = _.uniq(permissionIdsFromRoles);

                // go through all permissions and add child permissions
                if (user.availablePermissions) {
                    // map group permissions for easy access
                    const availableGroupPermissionsMap: {
                        [allId: string]: PermissionModel
                    } = {};
                    user.availablePermissions.forEach((groupPermission: PermissionModel) => {
                        availableGroupPermissionsMap[groupPermission.groupAllId] = groupPermission;
                    });

                    // determine all permissions and add child permissions
                    const newPermissionIds = [...(finalUserPermissions || [])];
                    (finalUserPermissions || []).forEach((permissionId: string) => {
                        if (availableGroupPermissionsMap[permissionId]) {
                            // add all child permissions from this group
                            (availableGroupPermissionsMap[permissionId].permissions || []).forEach((permissionData) => {
                                newPermissionIds.push(permissionData.id);
                            });
                        }
                    });

                    // replace user permissions
                    finalUserPermissions = newPermissionIds;
                }

                // set permissions
                user.permissionIds = finalUserPermissions;

                // finished
                return user;

            case UserRoleModel:
                // create the UserRole instance
                const userRole = new UserRoleModel(data);

                // check if we have available permissions
                const availablePermissions: PermissionModel[] = _.get(data, 'availablePermissions');

                if (availablePermissions) {
                    // set role's permissions
                    const mappedPermissions: {
                        [id: string]: IPermissionChildModel
                    } = {};
                    (availablePermissions || []).forEach((groupData: PermissionModel) => {
                        // add group key
                        mappedPermissions[groupData.groupAllId] = {
                            id: groupData.groupAllId as any,
                            label: groupData.groupLabel,
                            description: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_ALL_DESCRIPTION'
                        };

                        // add group child permissions
                        (groupData.permissions || []).forEach((permission) => {
                            mappedPermissions[permission.id] = permission;
                        });
                    });

                    // map permissions for easy access
                    userRole.permissions = [];
                    (userRole.permissionIds || []).forEach((permissionId: string) => {
                        if (mappedPermissions[permissionId]) {
                            userRole.permissions.push(mappedPermissions[permissionId]);
                        }
                    });
                }

                return userRole;

            // custom instantiation routine for Team model
            case TeamModel:
                // create the Team instance
                const team = new TeamModel(data);

                // set locations
                team.locations = this.mapListToModel(
                    _.get(data, 'locations', []),
                    LocationModel
                );

                // set users
                team.members = this.mapListToModel(
                    _.get(data, 'members', []),
                    UserModel
                );

                return team;

            case OutbreakModel:
                // create the Outbreak instance
                const outbreak = new OutbreakModel(data);

                // set locations
                outbreak.locations = this.mapListToModel(
                    _.get(data, 'locations', []),
                    LocationModel
                );

                return outbreak;

            case MetricCasesPerLocationCountsModel:
                // create the Outbreak instance
                const metricCasesPerLocationCounts = new MetricCasesPerLocationCountsModel(data);

                // set locations
                metricCasesPerLocationCounts.locations = this.mapListToModel(
                    _.get(data, 'locations', []),
                    MetricLocationCasesCountsModel
                );

                return metricCasesPerLocationCounts;

            default:
                return new modelClass(data);
        }
    }
}

