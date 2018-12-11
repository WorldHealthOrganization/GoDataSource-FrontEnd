import * as _ from 'lodash';

export class ContactFollowUpsModel {
    count: number;

    constructor(data = null) {
        this.count = _.get(data, 'count');
    }
}
