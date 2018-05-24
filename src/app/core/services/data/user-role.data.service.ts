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
     * Retrieve the list of User Roles
     * @returns {Observable<UserRoleModel[]>}
     */
    getRolesList(): Observable<UserRoleModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get('roles'),
            UserRoleModel
        );
    }

    /**
     * Retrieve a User Role
     * @param {string} roleId
     * @returns {Observable<UserRoleModel>}
     */
    getRole(roleId: string): Observable<UserRoleModel> {
        return this.observableHelper.mapToModel(
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
        return this.http.post('roles', userRole);
    }

    /**
     * Modify an existing User Role
     * @param {string} roleId
     * @returns {Observable<any>}
     */
    modifyRole(roleId: string, data: any): Observable<any> {
        return this.http.patch(`roles/${roleId}`, data);
    }

    /**
     * Delete an existing User Role
     * @param {string} roleId
     * @returns {Observable<any>}
     */
    deleteRole(roleId: string): Observable<any> {
        return this.http.delete(`roles/${roleId}`);
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

