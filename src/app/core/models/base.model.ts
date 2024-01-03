import * as _ from 'lodash';
import { LocalizationHelper, Moment } from '../helperClasses/localization-helper';

/**
 * createdByUser & updatedByUser receive limited data from API
 */
class UserLessModel {
  // data
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  deleted: boolean;

  /**
   * Constructor
   */
  constructor(data) {
    this.id = _.get(data, 'id');
    this.firstName = _.get(data, 'firstName');
    this.lastName = _.get(data, 'lastName');
    this.email = _.get(data, 'email');
    this.deleted = _.get(data, 'deleted');
  }

  /**
   * User Name
   */
  get name(): string {
    const firstName = _.get(this, 'firstName', '');
    const lastName = _.get(this, 'lastName', '');
    return _.trim(`${firstName} ${lastName}`);
  }

  /**
   * Get username and email
   */
  get nameAndEmail(): string {
    return `${this.name} ( ${this.email} )`;
  }
}

/**
 * Base model
 */
export class BaseModel {
  createdAt: Moment;
  createdBy: string;
  createdByUser: UserLessModel;
  createdOn: string;
  updatedAt: Moment;
  updatedBy: string;
  updatedByUser: UserLessModel;
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
      this.createdByUser = new UserLessModel(this.createdByUser);
    }

    // createdOn ?
    this.createdOn = _.get(data, 'createdOn');

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
      this.updatedByUser = new UserLessModel(this.updatedByUser);
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
