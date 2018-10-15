import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';

export class SystemClientApplicationModel {
    id: string;
    name: string;
    credentials: SystemUpstreamServerCredentialsModel;
    active: boolean;
    outbreakIDs: string[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.credentials = new SystemUpstreamServerCredentialsModel(_.get(data, 'credentials'));
        this.active = _.get(data, 'active', true);
        this.outbreakIDs = _.get(data, 'outbreakIDs', []);
    }
}
