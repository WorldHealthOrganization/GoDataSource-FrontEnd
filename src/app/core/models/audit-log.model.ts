import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBasic, IPermissionExportable } from './permission.interface';
import { PERMISSION } from './permission.model';
import { ChangeValue } from '../../shared/components-v2/app-changes-v2/models/change.model';

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
  IPermissionBasic, IPermissionExportable {
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

  // used by ui
  uiChangeValue: ChangeValue[];

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(): boolean { return false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.AUDIT_LOG_LIST) : false; }
  static canCreate(): boolean { return false; }
  static canModify(): boolean { return false; }
  static canDelete(): boolean { return false; }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return (user ? user.hasPermissions(PERMISSION.AUDIT_LOG_EXPORT) : false); }

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
  canView(): boolean { return AuditLogModel.canView(); }
  canList(user: UserModel): boolean { return AuditLogModel.canList(user); }
  canCreate(): boolean { return AuditLogModel.canCreate(); }
  canModify(): boolean { return AuditLogModel.canModify(); }
  canDelete(): boolean { return AuditLogModel.canDelete(); }

  /**
    * Permissions - IPermissionExportable
    */
  canExport(user: UserModel): boolean { return AuditLogModel.canExport(user); }
}
