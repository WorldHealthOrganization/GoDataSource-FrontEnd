import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBackup, IPermissionBasic, IPermissionRestorable } from './permission.interface';
import { PERMISSION } from './permission.model';

export class BackupModel
    implements
        IPermissionBasic,
        IPermissionRestorable,
        IPermissionBackup {
    id: string;
    description: string;
    location: string;
    modules: string[];
    date: string;
    status: string;
    error: string;
    userId: string;
    user: UserModel;

    // size in bytes
    private _sizeBytes: number;
    private _sizeBytesHumanReadable: string;
    get sizeBytes(): number {
        return this._sizeBytes;
    }
    set sizeBytes(sizeBytes: number) {
        // set value
        this._sizeBytes = sizeBytes;

        // format human readable
        if (this.sizeBytes) {
            const k = 1024;
            const dm = 2;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(this.sizeBytes) / Math.log(k));
            this._sizeBytesHumanReadable = parseFloat((this.sizeBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        } else {
            this._sizeBytesHumanReadable = '-';
        }
    }

    /**
     * Get Size in friendly form
     */
    get sizeBytesHumanReadable(): string {
        return this._sizeBytesHumanReadable;
    }

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_CREATE) : false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_DELETE) : false; }

    /**
     * Static Permissions - IPermissionRestorable
     */
    static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_RESTORE) : false; }

    /**
     * Static Permissions - IPermissionBackup
     */
    static canSetAutomaticBackupSettings(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_AUTOMATIC_SETTINGS) : false; }
    static canViewCloudBackupLocations(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.BACKUP_VIEW_CLOUD_BACKUP) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id', _.get(data, 'backupId'));
        this.description = _.get(data, 'description');
        this.location = _.get(data, 'location');
        this.modules = _.get(data, 'modules', []);
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
        this.error = _.get(data, 'error');
        this.userId = _.get(data, 'userId');
        this.sizeBytes = _.get(data, 'sizeBytes', 0);

        this.user = _.get(data, 'user');
        if (!_.isEmpty(this.user)) {
            this.user = new UserModel(this.user);
        }
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return BackupModel.canView(user); }
    canList(user: UserModel): boolean { return BackupModel.canList(user); }
    canCreate(user: UserModel): boolean { return BackupModel.canCreate(user); }
    canModify(user: UserModel): boolean { return BackupModel.canModify(user); }
    canDelete(user: UserModel): boolean { return BackupModel.canDelete(user); }

    /**
     * Permissions - IPermissionRestorable
     */
    canRestore(user: UserModel): boolean { return BackupModel.canRestore(user); }

    /**
     * Permissions - IPermissionBackup
     */
    canSetAutomaticBackupSettings(user: UserModel): boolean { return BackupModel.canSetAutomaticBackupSettings(user); }
    canViewCloudBackupLocations(user: UserModel): boolean { return BackupModel.canViewCloudBackupLocations(user); }
}
