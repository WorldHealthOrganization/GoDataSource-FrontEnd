import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { PERMISSION } from './permission.model';
import { Moment } from '../helperClasses/localization-helper';
import { BaseModel } from './base.model';

export class SavedImportField {
  source: string;
  destination: string;
  options: SavedImportOption[];
  levels: number[];

  constructor(data: {
    source?: string,
    destination?: string,
    options?: SavedImportOption[],
    levels?: number[]
  } = {}) {
    Object.assign(
      this,
      data
    );
  }
}

export class SavedImportOption {
  source: string;
  destination: string;

  constructor(data: {
    source?: string,
    destination?: string
  } = {}) {
    Object.assign(
      this,
      data
    );
  }
}

export interface ISavedImportMappingModel {
  id: string;
  name: string;
  readOnly: boolean;
}

export class SavedImportMappingModel
  extends BaseModel implements
        IPermissionBasic,
        ISavedImportMappingModel {

  // data
  id: string;
  name: string;
  isPublic: boolean;
  readOnly: boolean;
  mappingKey: string;
  mappingData: SavedImportField[];
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
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_IMPORT) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_IMPORT) : false; }

  /**
     * Constructor
     */
  constructor(data: {
    id?: string,
    name?: string,
    isPublic?: boolean,
    readOnly?: boolean,
    mappingKey?: string,
    mappingData?: SavedImportField[]
  }) {
    super(data);

    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.isPublic = _.get(data, 'isPublic', false);
    this.readOnly = _.get(data, 'readOnly', false);
    this.mappingKey = _.get(data, 'mappingKey');
    this.mappingData = _.get(data, 'mappingData', []);
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return SavedImportMappingModel.canView(user); }
  canList(user: UserModel): boolean { return SavedImportMappingModel.canList(user); }
  canCreate(user: UserModel): boolean { return SavedImportMappingModel.canCreate(user); }
  canModify(user: UserModel): boolean { return SavedImportMappingModel.canModify(user); }
  canDelete(user: UserModel): boolean { return SavedImportMappingModel.canDelete(user); }
}
