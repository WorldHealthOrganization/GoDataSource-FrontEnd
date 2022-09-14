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
    options: {
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
      }
    ];

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
     * Permissions - IPermissionTeam
     */
  canListWorkload(user: UserModel): boolean { return TeamModel.canListWorkload(user); }
}

