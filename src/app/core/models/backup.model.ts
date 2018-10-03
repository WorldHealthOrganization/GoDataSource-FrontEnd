import * as _ from 'lodash';
import { SystemSettingsBackupModule } from '../enums/system-settings-backup-module.enum';

export class BackupModel {
    id: string;
    location: string;
    modules: SystemSettingsBackupModule[];
    date: string;
    status: string;
    error: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.location = _.get(data, 'location');
        this.modules = _.get(data, 'modules', []);
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
        this.error = _.get(data, 'error');
    }
}
