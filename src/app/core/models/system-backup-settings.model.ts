import * as _ from 'lodash';
import { SystemSettingsBackupModule } from '../enums/system-settings-backup-module.enum';

export class SystemBackupSettingsModel {
    modules: SystemSettingsBackupModule[];
    backupInterval: number;
    dataRetentionInterval: number;
    location: string;

    constructor(data = null) {
        this.modules = _.get(data, 'modules', []);
        this.backupInterval = _.get(data, 'backupInterval');
        this.dataRetentionInterval = _.get(data, 'dataRetentionInterval');
        this.location = _.get(data, 'location');
    }
}
