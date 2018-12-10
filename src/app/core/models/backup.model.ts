import * as _ from 'lodash';
import { UserModel } from './user.model';

export class BackupModel {
    id: string;
    location: string;
    modules: string[];
    date: string;
    status: string;
    error: string;
    userId: string;
    user: UserModel;

    constructor(data = null) {
        this.id = _.get(data, 'id', _.get(data, 'backupId'));
        this.location = _.get(data, 'location');
        this.modules = _.get(data, 'modules', []);
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
        this.error = _.get(data, 'error');
        this.userId = _.get(data, 'userId');
        this.user = _.get(data, 'user');
    }
}
