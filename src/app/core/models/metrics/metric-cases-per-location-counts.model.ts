import * as _ from 'lodash';
import { MetricLocationCasesCountsModel } from './metric-location-cases-count.model';

export class MetricCasesPerLocationCountsModel {
    locations: MetricLocationCasesCountsModel[];
    count: number;

    constructor(data = null) {
        this.locations = _.get(data, 'locations', []);
        this.count = _.get(data, 'count', 0);
    }
}
