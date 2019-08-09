import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';
import { OutbreakModel } from './outbreak.model';
import { v4 as uuid } from 'uuid';

export class SystemClientApplicationModel {
    id: string;
    name: string;
    credentials: SystemUpstreamServerCredentialsModel;
    active: boolean;

    outbreakIDs: string[];
    outbreaks: OutbreakModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id', uuid());
        this.name = _.get(data, 'name');
        this.credentials = new SystemUpstreamServerCredentialsModel(_.get(data, 'credentials'));
        this.active = _.get(data, 'active', true);
        this.outbreakIDs = _.get(data, 'outbreakIDs', []);
    }
}
