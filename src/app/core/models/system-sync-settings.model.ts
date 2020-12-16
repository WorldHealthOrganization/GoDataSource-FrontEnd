import * as _ from 'lodash';

export class SystemSyncSettingsModel {
    triggerBackupBeforeSync: boolean;

    constructor(data = null) {
        this.triggerBackupBeforeSync = _.get(data, 'triggerBackupBeforeSync', true);
    }
}
