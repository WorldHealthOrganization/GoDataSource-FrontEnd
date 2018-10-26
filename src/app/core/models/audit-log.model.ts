import * as _ from 'lodash';
import { UserModel } from './user.model';

export class AuditLogChangeDataModel {
    field: string;
    oldValue: any;
    newValue: any;

    constructor(data = null) {
        this.field = _.get(data, 'field');
        this.oldValue = _.get(data, 'oldValue');
        this.newValue = _.get(data, 'newValue');
    }
}

export class AuditLogModel {
    action: string;
    modelName: string;
    changedData: AuditLogChangeDataModel[];
    userId: string;
    user: UserModel;
    userRole: string;
    userIPAddress: string;
    createdAt: string;

    constructor(data = null) {
        this.action = _.get(data, 'action');
        this.modelName = _.get(data, 'modelName');

        this.userId = _.get(data, 'userId');
        this.user = new UserModel(_.get(data, 'user'));

        this.userRole = _.get(data, 'userRole');
        this.userIPAddress = _.get(data, 'userIPAddress');
        this.createdAt = _.get(data, 'createdAt');
        this.changedData = _.map(_.get(data, 'changedData'), (item: any) => {
            return new AuditLogChangeDataModel(item);
        });
    }
}
