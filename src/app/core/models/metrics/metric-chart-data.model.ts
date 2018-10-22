import * as _ from 'lodash';
export class MetricChartDataModel {
    name: string;
    value: number;
    constructor(data = null) {
        this.name = _.get(data, 'name', '');
        this.value = _.get(data, 'value', 0);
    }
}
