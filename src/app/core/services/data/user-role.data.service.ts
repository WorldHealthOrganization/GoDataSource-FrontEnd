import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PERMISSION, UserRoleModel } from '../../models/user-role.model';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';

@Injectable()
export class UserRoleDataService {

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService
    ) {
    }

    /**
     * Return the list of User Roles
     * @returns {Observable<UserRoleModel[]>}
     */
    getRolesList(): Observable<UserRoleModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get('roles'),
            UserRoleModel
        );
    }

    /**
     * Create a new User Role
     * @param {UserRoleModel} userRole
     * @returns {Observable<UserRoleModel[]>}
     */
    createRole(userRole: UserRoleModel): Observable<any> {
        return this.http.post('roles', userRole)
            .map((rolesList: any[]) => {
                return rolesList.map((role) => {
                    return new UserRoleModel(role);
                });
            });
    }

    /**
     * Return the list of all the available permissions
     * @returns {Observable<string[]>}
     */
    getAvailablePermissions(): Observable<string[]> {
        const permissions = [];

        for (const key in PERMISSION) {
            permissions.push(PERMISSION[key]);
        }

        return Observable.of(permissions);
    }
}

