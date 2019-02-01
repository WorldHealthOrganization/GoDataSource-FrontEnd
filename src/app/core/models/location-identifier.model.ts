import * as _ from 'lodash';

export class LocationIdentifierModel {
    code: string;
    description: string;

    constructor(data = null) {
        this.code = _.get(data, 'code');
        this.description = _.get(data, 'description');
    }
}
