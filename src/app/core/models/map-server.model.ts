import * as _ from 'lodash';

export class MapServerModel {
    name: string;
    url: string;

    constructor(data = null) {
        this.name = _.get(data, 'name');
        this.url = _.get(data, 'url');
    }
}
