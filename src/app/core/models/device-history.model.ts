import * as _ from 'lodash';

export class DeviceHistoryModel {
    id: string;
    deviceId: string;
    status: string;
    createdAt: string;

    constructor(data = null) {
        this.id = _.get(data, 'id', '');
        this.deviceId = _.get(data, 'deviceId', '');
        this.createdAt = _.get(data, 'createdAt', '');
        this.status = _.get(data, 'status', '');
    }
}
