import * as _ from 'lodash';
import { SystemBackupSettingsModel } from './system-backup-settings.model';
import { SystemUpstreamServerModel } from './system-upstream-server.model';
import { SystemSyncSettingsModel } from './system-sync-settings.model';

export class SystemSettingsModel {
    dataBackup: SystemBackupSettingsModel;
    upstreamServers: SystemUpstreamServerModel[];
    sync: SystemSyncSettingsModel;

    constructor(data = null) {
        this.dataBackup = new SystemBackupSettingsModel(_.get(data, 'dataBackup'));

        this.upstreamServers = _.get(data, 'upstreamServers', []);
        this.upstreamServers = _.map(this.upstreamServers, (upstreamServer) => {
            return new SystemUpstreamServerModel(upstreamServer);
        });

        this.sync = new SystemSyncSettingsModel(_.get(data, 'sync'));
    }
}
