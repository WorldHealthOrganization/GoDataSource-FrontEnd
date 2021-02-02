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
    startedAt: Moment;
    endedAt: Moment;
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

    // duration
    private _duration: moment.duration;
    private _durationHumanReadable: string;

    /**
     * Get Duration in friendly form
     */
    get duration(): moment.duration {
        return this._duration;
    }

    set duration(duration) {
        // set value
        this._duration = duration;

        // format human readable
        if (this._duration.asSeconds() !== 0) {
            this._durationHumanReadable = moment.setDiffTimeString(this._duration);
        } else {
            this._durationHumanReadable = '-';
        }
    }

    /**
     * Get Duration in friendly form
     */
    get durationHumanReadable(): string {
        return this._durationHumanReadable;
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
        this.startedAt = _.get(data, 'startedAt');
        if (this.startedAt) {
            this.startedAt = moment(this.startedAt);
        }

        // endedAt
        this.endedAt = _.get(data, 'endedAt');
        if (this.endedAt) {
            this.endedAt = moment(this.endedAt);
        }

        // set duration
        this.duration = this.startedAt && this.endedAt ?
            moment.duration(this.endedAt.diff(this.startedAt)) :
            moment.duration();

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
