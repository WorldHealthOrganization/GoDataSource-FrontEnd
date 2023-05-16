import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { RestoreStatusStep } from './constants';

export class RestoreLogModel
  extends BaseModel
  implements
        IPermissionBasic {
  id: string;
  status: string;
  statusStep: RestoreStatusStep;
  totalNo: number;
  processedNo: number;

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return !!user; }
  static canList(): boolean { return false; }
  static canCreate(): boolean { return false; }
  static canModify(): boolean { return false; }
  static canDelete(): boolean { return false; }

  /**
   * Constructor
   */
  constructor(data = null) {
    super(data);

    // import data
    this.id = _.get(data, 'id');
    this.status = _.get(data, 'status');
    this.statusStep = _.get(data, 'statusStep');
    this.totalNo = _.get(data, 'totalNo');
    this.processedNo = _.get(data, 'processedNo');
  }

  /**
   * Permissions - IPermissionBasic
   */
  canView(user: UserModel): boolean { return RestoreLogModel.canView(user); }
  canList(): boolean { return RestoreLogModel.canList(); }
  canCreate(): boolean { return RestoreLogModel.canCreate(); }
  canModify(): boolean { return RestoreLogModel.canModify(); }
  canDelete(): boolean { return RestoreLogModel.canDelete(); }
}
