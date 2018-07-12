import * as _ from 'lodash';

export class ExposureTypeModel {
    id: string;
    count: number;
    contactIDs: string[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.count = _.get(data, 'count');
        this.contactIDs = _.get(data, 'contactIDs', []);
    }
}
