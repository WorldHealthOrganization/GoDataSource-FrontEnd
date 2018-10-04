import * as _ from 'lodash';

export class BackupModel {
    id: string;
    location: string;
    modules: string[];
    date: string;
    status: string;
    error: string;

    constructor(data = null) {
        this.id = _.get(data, 'id', _.get(data, 'backupId'));
        this.location = _.get(data, 'location');
        this.modules = _.get(data, 'modules', []);
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
        this.error = _.get(data, 'error');
    }
}
