import * as _ from 'lodash';

export class SystemSyncModel {
    syncLogId: string;

    constructor(data = null) {
        this.syncLogId = _.get(data, 'syncLogId', true);
    }
}
