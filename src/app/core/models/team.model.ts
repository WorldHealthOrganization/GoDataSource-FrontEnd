import * as _ from 'lodash';
import { UserModel } from './user.model';
import { LocationModel } from './location.model';
import { IPermissionBasic, IPermissionTeam } from './permission.interface';
import { PERMISSION } from './permission.model';
import { BaseModel } from './base.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';

export class TeamModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionTeam {
  id: string;
  name: string;
  userIds: string[];
  members: UserModel[] = [];
  locationIds: string[];
  locations: LocationModel[] = [];

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    authUser: UserModel,
    options: {
      createdOn: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_TEAM_FIELD_LABEL_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'userIds',
        label: 'LNG_TEAM_FIELD_LABEL_USERS',
        options: data.options.user
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdOn',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_ON',
        options: data.options.createdOn,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_TEAM_FIELD_LABEL_UPDATED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_TEAM_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_TEAM_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return advancedFilters;
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_DELETE) : false; }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_EXPORT) : false; }

  /**
   * Static Permissions - IPermissionImportable
   */
  static canImport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_IMPORT) : false; }

  /**
     * Static Permissions - IPermissionTeam
     */
  static canListWorkload(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_LIST_WORKLOAD) : false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    // parent
    super(data);

    // data
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.userIds = _.get(data, 'userIds', []);
    this.locationIds = _.get(data, 'locationIds', []);
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return TeamModel.canView(user); }
  canList(user: UserModel): boolean { return TeamModel.canList(user); }
  canCreate(user: UserModel): boolean { return TeamModel.canCreate(user); }
  canModify(user: UserModel): boolean { return TeamModel.canModify(user); }
  canDelete(user: UserModel): boolean { return TeamModel.canDelete(user); }

  /**
   * Permissions - IPermissionExportable
   */
  canExport(user: UserModel): boolean { return TeamModel.canExport(user); }

  /**
   * Permissions - IPermissionImportable
   */
  canImport(user: UserModel): boolean { return TeamModel.canImport(user); }

  /**
     * Permissions - IPermissionTeam
     */
  canListWorkload(user: UserModel): boolean { return TeamModel.canListWorkload(user); }
}

