import * as _ from 'lodash';
import { SystemBackupSettingsModel } from './system-backup-settings.model';
import { SystemUpstreamServerModel } from './system-upstream-server.model';
import { SystemSyncSettingsModel } from './system-sync-settings.model';
import { SystemClientApplicationModel } from './system-client-application.model';

export class SystemSettingsModel {
    dataBackup: SystemBackupSettingsModel;
    upstreamServers: SystemUpstreamServerModel[];
    clientApplications: SystemClientApplicationModel[];
    sync: SystemSyncSettingsModel;

    constructor(data = null) {
        this.dataBackup = new SystemBackupSettingsModel(_.get(data, 'dataBackup'));

        this.upstreamServers = _.get(data, 'upstreamServers', []);
        this.upstreamServers = _.map(this.upstreamServers, (upstreamServer) => {
            return new SystemUpstreamServerModel(upstreamServer);
        });

        this.clientApplications = _.get(data, 'clientApplications', []);
        this.clientApplications = _.map(this.clientApplications, (clientApplication) => {
            return new SystemClientApplicationModel(clientApplication);
        });

        this.sync = new SystemSyncSettingsModel(_.get(data, 'sync'));
    }
}
