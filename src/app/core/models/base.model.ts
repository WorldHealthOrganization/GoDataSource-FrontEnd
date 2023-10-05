import * as _ from 'lodash';
import { UserModel } from './user.model';
import { LocalizationHelper, Moment } from '../helperClasses/localization-helper';

export class BaseModel {
  createdAt: Moment;
  createdBy: string;
  createdByUser: UserModel;
  updatedAt: Moment;
  updatedBy: string;
  updatedByUser: UserModel;
  deleted: boolean;
  deletedAt: Moment;

  constructor(data) {
    // created at
    this.createdAt = _.get(data, 'createdAt');
    if (this.createdAt) {
      this.createdAt = LocalizationHelper.toMoment(this.createdAt);
    }

    // created by
    this.createdBy = _.get(data, 'createdBy');

    // created by user
    this.createdByUser = _.get(data, 'createdByUser');
    if (this.createdByUser) {
      this.createdByUser = new UserModel(this.createdByUser);
    }

    // updated at
    this.updatedAt = _.get(data, 'updatedAt');
    if (this.updatedAt) {
      this.updatedAt = LocalizationHelper.toMoment(this.updatedAt);
    }

    // updated by
    this.updatedBy = _.get(data, 'updatedBy');

    // updated by user
    this.updatedByUser = _.get(data, 'updatedByUser');
    if (this.updatedByUser) {
      this.updatedByUser = new UserModel(this.updatedByUser);
    }

    // deleted ?
    this.deleted = _.get(data, 'deleted');

    // deleted at
    this.deletedAt = _.get(data, 'deletedAt');
    if (this.deletedAt) {
      this.deletedAt = LocalizationHelper.toMoment(this.deletedAt);
    }
  }
}
