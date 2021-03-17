import * as _ from 'lodash';
import { UserModel } from './user.model';
import { IPermissionBackup, IPermissionBasic, IPermissionRestorable } from './permission.interface';
import { PERMISSION } from './permission.model';
import { FileSize } from '../helperClasses/file-size';
import { Moment, moment } from '../helperClasses/x-moment';

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
            this._sizeBytesHumanReadable = FileSize.bytesToReadableForm(this.sizeBytes);
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

    // startedAt
    private _startedAt: Moment;
    get startedAt(): Moment {
        return this._startedAt;
    }
    set startedAt(date: Moment) {
        // set value
        this._startedAt = date;

        // update duration
        this.updateDuration();
    }

    // endedAt
    private _endedAt: Moment;
    get endedAt(): Moment {
        return this._endedAt;
    }
    set endedAt(date: Moment) {
        // set value
        this._endedAt = date;

        // update duration
        this.updateDuration();
    }

    // duration
    private _duration: string;
    get duration(): string {
        return this._duration;
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

        // startedAt
        const startedAt = _.get(data, 'startedAt');
        this.startedAt = startedAt ? moment(startedAt) : undefined;

        // endedAt
        const endedAt = _.get(data, 'endedAt');
        this.endedAt = endedAt ? moment(endedAt) : undefined;

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

    /**
     * Update and Set Duration in friendly form
     */
    private updateDuration(): void {
        this._duration = moment.humanizeDurationBetweenTwoDates(this._endedAt, this._startedAt);
        this._duration = this._duration || '-';
    }
}
