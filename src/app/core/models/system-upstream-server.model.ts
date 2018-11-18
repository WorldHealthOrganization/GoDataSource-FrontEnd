import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';

export class SystemUpstreamServerModel {
    id: string;
    name: string;
    description: string;
    url: string;
    timeout: number;
    credentials: SystemUpstreamServerCredentialsModel;
    syncInterval: number;
    syncOnEveryChange: boolean;
    syncEnabled: boolean;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.url = _.get(data, 'url');
        this.timeout = _.get(data, 'timeout', 0);
        this.credentials = new SystemUpstreamServerCredentialsModel(_.get(data, 'credentials'));
        this.syncInterval = _.get(data, 'syncInterval', 0);
        this.syncOnEveryChange = _.get(data, 'syncOnEveryChange', false);
        this.syncEnabled = _.get(data, 'syncEnabled', true);
    }
}
