import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { PERMISSION } from './permission.model';

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

export class AuditLogModel
    implements
        IPermissionBasic {
    id: string;
    action: string;
    modelName: string;
    changedData: AuditLogChangeDataModel[];
    userId: string;
    user: UserModel;
    userRole: string;
    userIPAddress: string;
    createdAt: string;
    recordId: string;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.AUDIT_LOG_LIST) : false; }
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.recordId = _.get(data, 'recordId');
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

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return AuditLogModel.canView(user); }
    canList(user: UserModel): boolean { return AuditLogModel.canList(user); }
    canCreate(user: UserModel): boolean { return AuditLogModel.canCreate(user); }
    canModify(user: UserModel): boolean { return AuditLogModel.canModify(user); }
    canDelete(user: UserModel): boolean { return AuditLogModel.canDelete(user); }
}
