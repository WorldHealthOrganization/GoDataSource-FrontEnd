import * as _ from 'lodash';

export class DeviceModel {
    id: string;
    name: string;
    description: string;
    physicalDeviceId: string;
    manufacturer: string;
    model: string;
    status: string;
    lastSeen: string;
    os: string;

    constructor(data = null) {
        this.id = _.get(data, 'id', '');
        this.name = _.get(data, 'name', '');
        this.description = _.get(data, 'description', '');
        this.physicalDeviceId = _.get(data, 'physicalDeviceId', '');
        this.manufacturer = _.get(data, 'manufacturer', '');
        this.model = _.get(data, 'model', '');
        this.status = _.get(data, 'status', '');
        this.lastSeen = _.get(data, 'lastSeen', '');
        this.os = _.get(data, 'os', '');
    }
}
