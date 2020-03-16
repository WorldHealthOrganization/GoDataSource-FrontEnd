import * as _ from 'lodash';
import { IPermissionBasic, IPermissionDevice } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class DeviceModel
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
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_VIEW, PERMISSION.DEVICE_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_DELETE) : false; }

    /**
     * Static Permissions - IPermissionDevice
     */
    static canListHistory(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_LIST_HISTORY) : false; }
    static canWipe(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DEVICE_WIPE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
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
    canCreate(user: UserModel): boolean { return DeviceModel.canCreate(user); }
    canModify(user: UserModel): boolean { return DeviceModel.canModify(user); }
    canDelete(user: UserModel): boolean { return DeviceModel.canDelete(user); }

    /**
     * Permissions - IPermissionDevice
     */
    canListHistory(user: UserModel): boolean { return DeviceModel.canListHistory(user); }
    canWipe(user: UserModel): boolean { return DeviceModel.canWipe(user); }
}
