import * as _ from 'lodash';

export class SystemBackupSettingsModel {
    disabled: boolean;
    description: string;
    modules: string[];
    backupInterval: number;
    dataRetentionInterval: number;
    location: string;

    constructor(data = null) {
        this.disabled = _.get(data, 'disabled', false);
        this.description = _.get(data, 'description');
        this.modules = _.get(data, 'modules', []);
        this.backupInterval = _.get(data, 'backupInterval');
        this.dataRetentionInterval = _.get(data, 'dataRetentionInterval');
        this.location = _.get(data, 'location');
    }
}
