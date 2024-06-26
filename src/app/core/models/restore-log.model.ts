import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { RestoreStatusStep } from './constants';
import { BackupModel } from './backup.model';
import { Moment } from '../helperClasses/localization-helper';

export class RestoreLogModel
  extends BaseModel
  implements
    IPermissionBasic {
  id: string;
  status: string;
  statusStep: RestoreStatusStep;
  totalNo: number;
  processedNo: number;
  actionStartDate: string | Moment;
  actionCompletionDate: string | Moment;
  backupId: string;
  backup: BackupModel;
  error: string;

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
    this.actionStartDate = _.get(data, 'actionStartDate');
    this.actionCompletionDate = _.get(data, 'actionCompletionDate');
    this.backupId = _.get(data, 'backupId');
    this.error = _.get(data, 'error');

    this.backup = _.get(data, 'backup');
    if (this.backup) {
      this.backup = new BackupModel(this.backup);
    }
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
