import * as _ from 'lodash';

export class OutbreakModel {
    id: string;
    name: string;
    description: string;
    disease: string;
    active: boolean;

    constructor(data) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
        this.active = _.get(data, 'active');
    }

}
