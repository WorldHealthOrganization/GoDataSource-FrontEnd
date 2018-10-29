import * as _ from 'lodash';

export class MetricCasesCountStratified {
    start: string;
    end: string;
    classification: any;
    total: number;

    constructor(data = null) {
        this.start = _.get(data, 'start', '');
        this.end = _.get(data, 'end', '');
        this.classification = _.get(data, 'classification', {});
        this.total = _.get(data, 'total', 0);
    }
}
