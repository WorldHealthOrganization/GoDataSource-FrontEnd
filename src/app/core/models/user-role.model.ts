import * as _ from 'lodash';
import { IPermissionChildModel, PERMISSION } from './permission.model';

export class UserRoleModel {
    id: string | null;
    name: string | null;
    permissionIds: PERMISSION[];
    description: string | null;
    permissions: IPermissionChildModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.permissionIds = _.get(data, 'permissionIds', []);
        this.description = _.get(data, 'description');
    }
}
