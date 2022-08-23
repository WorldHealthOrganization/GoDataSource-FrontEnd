import * as _ from 'lodash';
import { IPermissionBasic, IPermissionDevice } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { BaseModel } from './base.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';

export class DeviceModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionDevice {
  id: string;
  name: string;
  description: string;
  physicalDeviceId: string;
  manufacturer: string;
  model: string;
  status: string;
  lastSeen: string;
  os: string;

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_LIST) : false; }
  static canCreate(): boolean { return false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_VIEW, PERMISSION.DEVICE_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_DELETE) : false; }

  /**
     * Static Permissions - IPermissionDevice
     */
  static canListHistory(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_LIST_HISTORY) : false; }
  static canWipe(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_WIPE) : false; }

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    options: {
      deviceStatus: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // finished
    return [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'physicalDeviceId',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_PHYSICAL_DEVICE_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'manufacturer',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MANUFACTURER',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'model',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_MODEL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'os',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_OPERATING_SYSTEM',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'status',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_STATUS',
        options: data.options.deviceStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'lastSeen',
        label: 'LNG_SYSTEM_DEVICE_FIELD_LABEL_LAST_SEEN',
        sortable: true
      }
    ];
  }

  /**
     * Constructor
     */
  constructor(data = null) {
    // parent
    super(data);

    // data
    this.id = _.get(data, 'id', '');
    this.name = _.get(data, 'name', '');
    this.description = _.get(data, 'description', '');
    this.physicalDeviceId = _.get(data, 'physicalDeviceId', '');
    this.manufacturer = _.get(data, 'manufacturer', '');
    this.model = _.get(data, 'model', '');
    this.status = _.get(data, 'status', '');
    this.lastSeen = _.get(data, 'lastSeen', '');
    this.os = _.get(data, 'os', '');
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return DeviceModel.canView(user); }
  canList(user: UserModel): boolean { return DeviceModel.canList(user); }
  canCreate(): boolean { return DeviceModel.canCreate(); }
  canModify(user: UserModel): boolean { return DeviceModel.canModify(user); }
  canDelete(user: UserModel): boolean { return DeviceModel.canDelete(user); }

  /**
     * Permissions - IPermissionDevice
     */
  canListHistory(user: UserModel): boolean { return DeviceModel.canListHistory(user); }
  canWipe(user: UserModel): boolean { return DeviceModel.canWipe(user); }
}
