import * as _ from 'lodash';

export class MapServerModel {
    name: string;
    url: string;
    type?: string;

    constructor(data = null) {
        this.name = _.get(data, 'name');
        this.url = _.get(data, 'url');
        this.type = _.get(data, 'type');
    }
}
