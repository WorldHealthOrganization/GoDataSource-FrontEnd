import * as _ from 'lodash';

export class MetricChartDataModel {
    name: string;
    value: number;
    classification?: string;

    constructor(data = null) {
        this.name = _.get(data, 'name', '');
        this.value = _.get(data, 'value', 0);
        this.classification = _.get(data, 'classification', '');
    }
}
