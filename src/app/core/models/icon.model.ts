import * as _ from 'lodash';

export class IconModel {
    id: string;
    name: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
    }
}
