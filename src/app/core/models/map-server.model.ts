import * as _ from 'lodash';

export class MapServerModel {
    // data
    name: string;
    url: string;
    type?: string;
    styleUrl?: string;
    styleUrlSource?: string;

    /**
     * Constructor
     */
    constructor(data = null) {
        this.name = _.get(data, 'name');
        this.url = _.get(data, 'url');
        this.type = _.get(data, 'type');
        this.styleUrl = _.get(data, 'styleUrl');
        this.styleUrlSource = _.get(data, 'styleUrlSource');
    }
}
