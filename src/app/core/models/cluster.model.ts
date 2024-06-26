import * as _ from 'lodash';
import { IPermissionBasic, IPermissionCluster } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { BaseModel } from './base.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';

export class ClusterModel extends BaseModel
  implements
        IPermissionBasic,
        IPermissionCluster {

  id: string;
  name: string;
  description: string;
  colorCode: string;
  icon: string;

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
        label: 'LNG_CLUSTER_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_CLUSTER_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'colorCode',
        label: 'LNG_CLUSTER_FIELD_LABEL_COLOR',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdOn',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_ON',
        options: data.options.createdOn,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_CLUSTER_FIELD_LABEL_UPDATED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_CLUSTER_FIELD_LABEL_UPDATED_BY',
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
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_VIEW, PERMISSION.CLUSTER_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_DELETE) : false; }

  /**
     * Static Permissions - IPermissionCluster
     */
  static canListPeople(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_LIST_PEOPLE) : false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    super(data);

    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.description = _.get(data, 'description');
    this.colorCode = _.get(data, 'colorCode');
    this.icon = _.get(data, 'icon');
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return ClusterModel.canView(user); }
  canList(user: UserModel): boolean { return ClusterModel.canList(user); }
  canCreate(user: UserModel): boolean { return ClusterModel.canCreate(user); }
  canModify(user: UserModel): boolean { return ClusterModel.canModify(user); }
  canDelete(user: UserModel): boolean { return ClusterModel.canDelete(user); }

  /**
     * Permissions - IPermissionCluster
     */
  canListPeople(user: UserModel): boolean { return ClusterModel.canListPeople(user); }
}
