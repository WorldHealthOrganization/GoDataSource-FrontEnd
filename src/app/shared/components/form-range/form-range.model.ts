import * as _ from 'lodash';

export class FormRangeModel {
    from: number;
    to: number;

    constructor(data = null) {
        this.from = _.get(data, 'from');
        this.to = _.get(data, 'to');
    }
}
