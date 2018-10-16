import * as _ from 'lodash';
import { OutbreakModel } from './outbreak.model';

export class SystemSyncLogModel {
    id: string;
    syncServerUrl: string;
    syncClientId: string;
    actionStartDate: string;
    actionCompletionDate: string;
    status: string;
    informationStartDate: string;
    error: string;

    outbreakIDs: string[];
    outbreaks: OutbreakModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.syncServerUrl = _.get(data, 'syncServerUrl');
        this.syncClientId = _.get(data, 'syncClientId');
        this.actionStartDate = _.get(data, 'actionStartDate');
        this.actionCompletionDate = _.get(data, 'actionCompletionDate');
        this.status = _.get(data, 'status');
        this.outbreakIDs = _.get(data, 'outbreakIDs', []);
        this.informationStartDate = _.get(data, 'informationStartDate');
        this.error = _.get(data, 'error');
    }
}
