import * as _ from 'lodash';

export class SystemBackupSettingsModel {
    // data
    disabled: boolean;
    backupType: string;
    backupDailyAtTime: string;
    description: string;
    modules: string[];
    backupInterval: number;
    dataRetentionInterval: number;
    location: string;

    /**
     * Constructor
     */
    constructor(data = null) {
        this.disabled = _.get(data, 'disabled', false);
        this.backupType = _.get(data, 'backupType');
        this.backupDailyAtTime = _.get(data, 'backupDailyAtTime');
        this.description = _.get(data, 'description');
        this.modules = _.get(data, 'modules', []);
        this.backupInterval = _.get(data, 'backupInterval');
        this.dataRetentionInterval = _.get(data, 'dataRetentionInterval');
        this.location = _.get(data, 'location');
    }
}
