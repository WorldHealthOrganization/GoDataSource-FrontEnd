import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';

export class ImportLogModel
  extends BaseModel
  implements
        IPermissionBasic {
  resourceType: string;
  status: string;
  totalNo: number;
  processedNo: number;
  result: {
    code: string,
    details: {
      model: string,
      success: number,
      failed: number
    }
  };
  actionStartDate: string;
  actionCompletionDate: string;

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return !!user; }
  static canList(user: UserModel): boolean { return !!user; }
  static canCreate(): boolean { return false; }
  static canModify(): boolean { return false; }
  static canDelete(): boolean { return false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    super(data);

    // import data
    this.resourceType = _.get(data, 'resourceType');
    this.status = _.get(data, 'status');
    this.totalNo = _.get(data, 'totalNo');
    this.processedNo = _.get(data, 'processedNo');
    this.result = _.get(data, 'result');
    this.actionStartDate = _.get(data, 'actionStartDate');
    this.actionCompletionDate = _.get(data, 'actionCompletionDate');
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return ImportLogModel.canView(user); }
  canList(user: UserModel): boolean { return ImportLogModel.canList(user); }
  canCreate(): boolean { return ImportLogModel.canCreate(); }
  canModify(): boolean { return ImportLogModel.canModify(); }
  canDelete(): boolean { return ImportLogModel.canDelete(); }
}
