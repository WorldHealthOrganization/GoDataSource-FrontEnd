import * as _ from 'lodash';

export class MetricChainsLengthModel {
    length: number;
    active: boolean;

    constructor(data = null) {
        this.length = _.get(data, 'length', 0);
        this.active = _.get(data, 'active');
    }
}
