import * as _ from 'lodash';

export class ClusterModel {
    id: string;
    name: string;
    description: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
    }
}
