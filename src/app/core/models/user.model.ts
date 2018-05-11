import * as _ from 'lodash';

import { UserRoleModel } from './user-role.model';

export class UserModel {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: UserRoleModel;

    constructor(data) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.username = _.get(data, 'username');
        this.email = _.get(data, 'email');
        this.role = new UserRoleModel(_.get(data, 'role'));
    }

    hasPermissions(...permissions: string[]) {
        return this.role.hasPermissions(...permissions);
    }
}
