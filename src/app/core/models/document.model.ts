import * as _ from 'lodash';

export class DocumentModel {
    type: string;
    number: string;

    constructor(data = null) {
        this.type = _.get(data, 'type');
        this.number = _.get(data, 'number');
    }
}
