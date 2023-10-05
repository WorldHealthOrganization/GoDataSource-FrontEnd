import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { PERMISSION } from './permission.model';
import { LocalizationHelper, Moment } from '../helperClasses/localization-helper';

/**
 * Saved side filter sort
 */
export class SavedFilterDataAppliedFilter {
  // data
  filter: {
    uniqueKey: string
  };
  comparator: string;
  value: any;
  extraValues: any;

  /**
     * Constructor
     */
  constructor(data: {
    filter?: {
      uniqueKey: string
    },
    comparator?: string,
    value?: any,
    extraValues?: any
  } = {}) {
    Object.assign(
      this,
      data
    );
  }
}

/**
 * Saved side filter sort
 */
export class SavedFilterDataAppliedSort {
  // data
  sort: {
    uniqueKey: string
  };
  direction: string;

  /**
     * Constructor
     */
  constructor(data: {
    sort?: {
      uniqueKey: string
    },
    direction?: string
  } = {}) {
    Object.assign(
      this,
      data
    );
  }
}

/**
 * Saved side filter data
 */
export class SavedFilterData {
  // data
  appliedFilters: SavedFilterDataAppliedFilter[];
  appliedFilterOperator: string;
  appliedSort: SavedFilterDataAppliedSort[];

  /**
     * Constructor
     */
  constructor(data: {
    appliedFilters?: SavedFilterDataAppliedFilter[],
    appliedFilterOperator?: any,
    appliedSort?: SavedFilterDataAppliedSort[]
  }) {
    data.appliedFilters = _.isArray(data.appliedFilters) ? data.appliedFilters : [];
    this.appliedFilters = _.map(data.appliedFilters, (savedFilter) =>
      savedFilter instanceof SavedFilterDataAppliedFilter ?
        savedFilter :
        new SavedFilterDataAppliedFilter(savedFilter));

    this.appliedFilterOperator = data.appliedFilterOperator;

    data.appliedSort = _.isArray(data.appliedSort) ? data.appliedSort : [];
    this.appliedSort = _.map(data.appliedSort, (savedSort) =>
      savedSort instanceof SavedFilterDataAppliedSort ?
        savedSort :
        new SavedFilterDataAppliedSort(savedSort));
  }
}

/**
 * Saved side filter model
 */
export class SavedFilterModel
implements IPermissionBasic {

  // data
  id: string;
  name: string;
  isPublic: boolean;
  readOnly: boolean;
  filterKey: string;
  filterData: SavedFilterData;
  createdBy: string;
  createdByUser: UserModel;
  updatedAt: Moment;
  updatedBy: string;
  updatedByUser: UserModel;

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return !!user; }
  static canList(user: UserModel): boolean { return !!user; }
  static canCreate(user: UserModel): boolean { return !!user; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_FILTERS) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_FILTERS) : false; }

  /**
     * Constructor
     */
  constructor(data: {
    id?: string,
    name?: string,
    isPublic?: boolean,
    readOnly?: boolean,
    filterKey?: string,
    filterData?: SavedFilterData
  }) {
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.isPublic = _.get(data, 'isPublic');
    this.readOnly = _.get(data, 'readOnly');
    this.filterKey = _.get(data, 'filterKey');
    this.filterData = new SavedFilterData(_.get(data, 'filterData', {}));

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
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return SavedFilterModel.canView(user); }
  canList(user: UserModel): boolean { return SavedFilterModel.canList(user); }
  canCreate(user: UserModel): boolean { return SavedFilterModel.canCreate(user); }
  canModify(user: UserModel): boolean { return SavedFilterModel.canModify(user); }
  canDelete(user: UserModel): boolean { return SavedFilterModel.canDelete(user); }
}
