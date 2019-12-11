import * as _ from 'lodash';
import { OutbreakModel } from './outbreak.model';
import { IPermissionBasic, IPermissionBasicBulk, IPermissionSyncLog } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class SystemSyncLogModel
    implements
        IPermissionBasic,
        IPermissionBasicBulk,
        IPermissionSyncLog {
    id: string;
    syncServerUrl: string;
    syncClientId: string;
    actionStartDate: string;
    actionCompletionDate: string;
    status: string;
    informationStartDate: string;
    error: string;

    outbreakIDs: string[];
    outbreaks: OutbreakModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_LOG_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_LOG_LIST) : false; }
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_LOG_DELETE) : false; }

    /**
     * Static Permissions - IPermissionBasicBulk
     */
    static canBulkCreate(user: UserModel): boolean { return false; }
    static canBulkModify(user: UserModel): boolean { return false; }
    static canBulkDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_LOG_BULK_DELETE) : false; }
    static canBulkRestore(user: UserModel): boolean { return false; }

    /**
     * Static Permissions - IPermissionSyncLog
     */
    static canSetSettings(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_SETTINGS) : false; }
    static canExportPackage(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_EXPORT_PACKAGE) : false; }
    static canImportPackage(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.SYNC_IMPORT_PACKAGE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.syncServerUrl = _.get(data, 'syncServerUrl');
        this.syncClientId = _.get(data, 'syncClientId');
        this.actionStartDate = _.get(data, 'actionStartDate');
        this.actionCompletionDate = _.get(data, 'actionCompletionDate');
        this.status = _.get(data, 'status');
        this.outbreakIDs = _.get(data, 'outbreakIDs', []);
        this.informationStartDate = _.get(data, 'informationStartDate');
        this.error = _.get(data, 'error');
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return SystemSyncLogModel.canView(user); }
    canList(user: UserModel): boolean { return SystemSyncLogModel.canList(user); }
    canCreate(user: UserModel): boolean { return SystemSyncLogModel.canCreate(user); }
    canModify(user: UserModel): boolean { return SystemSyncLogModel.canModify(user); }
    canDelete(user: UserModel): boolean { return SystemSyncLogModel.canDelete(user); }

    /**
     * Permissions - IPermissionBasicBulk
     */
    canBulkCreate(user: UserModel): boolean { return SystemSyncLogModel.canBulkCreate(user); }
    canBulkModify(user: UserModel): boolean { return SystemSyncLogModel.canBulkModify(user); }
    canBulkDelete(user: UserModel): boolean { return SystemSyncLogModel.canBulkDelete(user); }
    canBulkRestore(user: UserModel): boolean { return SystemSyncLogModel.canBulkRestore(user); }

    /**
     * Permissions - IPermissionSyncLog
     */
    canSetSettings(user: UserModel): boolean { return SystemSyncLogModel.canSetSettings(user); }
    canExportPackage(user: UserModel): boolean { return SystemSyncLogModel.canExportPackage(user); }
    canImportPackage(user: UserModel): boolean { return SystemSyncLogModel.canImportPackage(user); }
}
