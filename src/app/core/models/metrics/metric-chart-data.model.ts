import * as _ from 'lodash';

export class MetricChartDataModel {
    name: string;
    value: number;
    extra?: string;

    constructor(data = null) {
        this.name = _.get(data, 'name', '');
        this.value = _.get(data, 'value', 0);
        this.extra = _.get(data, 'extra', '');
    }
}
