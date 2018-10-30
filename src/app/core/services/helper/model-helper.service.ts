import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { UserModel } from '../../models/user.model';
import { UserRoleModel } from '../../models/user-role.model';
import { PermissionModel } from '../../models/permission.model';
import * as _ from 'lodash';
import { TeamModel } from '../../models/team.model';
import { LocationModel } from '../../models/location.model';
import { OutbreakModel } from '../../models/outbreak.model';

@Injectable()
export class ModelHelperService {

    /**
     * Transform an observable's response from a list of objects to a list of model instances
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for each item in the list
     * @returns {Observable<any[]>}
     */
    mapObservableListToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs.map(
            (listResult) => {
                return listResult.map((item) => {
                    return this.getModelInstance(modelClass, item);
                });
            }
        );
    }

    /**
     * Transform an observable's response from an object to an instance of a model
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for the retrieved item
     * @returns {Observable<any>}
     */
    mapObservableToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs.map(
            (itemResult) => {
                return this.getModelInstance(modelClass, itemResult);
            }
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
                const permissionIdsFromRoles = _.flatten(_.map(user.roles, (role) => {
                    return role.permissionIds;
                }));

                // keep only unique permissions
                user.permissionIds = _.uniq(permissionIdsFromRoles);

                return user;

            case UserRoleModel:
                // create the UserRole instance
                const userRole = new UserRoleModel(data);

                // check if we have available permissions
                const availablePermissions: PermissionModel[] = _.get(data, 'availablePermissions');

                if (availablePermissions) {
                    // set role's permissions
                    userRole.permissions = _.filter(availablePermissions, (permission: PermissionModel) => {
                        return _.indexOf(userRole.permissionIds, permission.id) >= 0;
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

            default:
                return new modelClass(data);
        }
    }
}

