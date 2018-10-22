import * as _ from 'lodash';
import { MetricChartDataModel } from './metric-chart-data.model';

export class MetricChartDataMultiModel {
    name: number;
    series:  MetricChartDataModel[];

    constructor(data = null) {
        this.name = _.get(data, 'name', '');
        this.series = _.get(data, 'series', []);
    }
}
