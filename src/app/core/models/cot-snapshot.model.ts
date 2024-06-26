import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { IPermissionBasic } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import { FileSize } from '../helperClasses/file-size';
import { LocalizationHelper, Moment } from '../helperClasses/localization-helper';

export class CotSnapshotModel
  extends BaseModel
  implements
        IPermissionBasic {
  id: string;
  name: string;
  outbreakId: string;
  status: string;
  error: string;
  startDate: Moment;
  endDate: Moment;
  showContacts: boolean;
  showContactsOfContacts: boolean;

  // size in bytes
  private _sizeBytes: number;
  private _sizeBytesHumanReadable: string;
  get sizeBytes(): number {
    return this._sizeBytes;
  }
  set sizeBytes(sizeBytes: number) {
    // set value
    this._sizeBytes = sizeBytes;

    // format human readable
    if (this.sizeBytes) {
      this._sizeBytesHumanReadable = FileSize.bytesToReadableForm(this.sizeBytes);
    } else {
      this._sizeBytesHumanReadable = '—';
    }
  }

  // file size in human readable format
  get sizeBytesHumanReadable(): string {
    return this._sizeBytesHumanReadable;
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }
  static canCreate(): boolean { return false; }
  static canModify(): boolean { return false; }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }

  /**
     * Constructor
     */
  constructor(data = null) {
    // base model
    super(data);

    // base data
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.outbreakId = _.get(data, 'outbreakId');
    this.status = _.get(data, 'status');
    this.error = _.get(data, 'error');
    this.showContacts = _.get(data, 'showContacts');
    this.showContactsOfContacts = _.get(data, 'showContactsOfContacts');

    // start date
    this.startDate = _.get(data, 'startDate');
    if (this.startDate) {
      this.startDate = LocalizationHelper.toMoment(this.startDate);
    }

    // file size
    this.sizeBytes = _.get(data, 'sizeBytes', 0);

    // end date
    this.endDate = _.get(data, 'endDate');
    if (this.endDate) {
      this.endDate = LocalizationHelper.toMoment(this.endDate);
    }
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return CotSnapshotModel.canView(user); }
  canList(user: UserModel): boolean { return CotSnapshotModel.canList(user); }
  canCreate(): boolean { return CotSnapshotModel.canCreate(); }
  canModify(): boolean { return CotSnapshotModel.canModify(); }
  canDelete(user: UserModel): boolean { return CotSnapshotModel.canDelete(user); }
}
