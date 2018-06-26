import * as _ from 'lodash';
import { UserRoleModel } from './user-role.model';
import { PERMISSION } from './permission.model';
import { SecurityQuestionModel } from "./securityQuestion.model";

export class UserModel {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordChange: boolean;
    activeOutbreakId: string;
    roleIds: string[];
    roles: UserRoleModel[] = [];
    permissionIds: PERMISSION[] = [];
    securityQuestions: SecurityQuestionModel[] = [];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.email = _.get(data, 'email');
        this.password = _.get(data, 'password');
        this.passwordChange = _.get(data, 'passwordChange', false);
        this.activeOutbreakId = _.get(data, 'activeOutbreakId');
        this.roleIds = _.get(data, 'roleIds', []);
        this.securityQuestions = _.get(data, 'securityQuestions');
    }

    hasPermissions(...permissionIds: PERMISSION[]): boolean {
        // ensure that the permission IDs list has unique elements
        permissionIds = _.uniq(permissionIds);

        // get the permissions that the user has
        const havingPermissions = _.filter(permissionIds, (permissionId) => {
            return this.permissionIds.indexOf(permissionId) >= 0;
        });

        // user must have all permissions
        return havingPermissions.length === permissionIds.length;
    }

    hasRole(roleId): boolean {
        return _.indexOf(this.roleIds, roleId) >= 0;
    }
}
