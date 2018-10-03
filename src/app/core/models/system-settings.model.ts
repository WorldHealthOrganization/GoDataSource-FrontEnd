import * as _ from 'lodash';
import { SystemBackupSettingsModel } from './system-backup-settings.model';

export class SystemSettingsModel {
    dataBackup: SystemBackupSettingsModel;

    constructor(data = null) {
        this.dataBackup = new SystemBackupSettingsModel(_.get(data, 'dataBackup'));
    }
}
