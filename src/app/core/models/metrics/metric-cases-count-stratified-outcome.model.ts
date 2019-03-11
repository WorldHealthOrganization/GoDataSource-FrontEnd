import * as _ from 'lodash';

export class MetricCasesCountStratifiedOutcome {
    start: string;
    end: string;
    outcome: any;
    total: number;

    constructor(data = null) {
        this.start = _.get(data, 'start', '');
        this.end = _.get(data, 'end', '');
        this.outcome = _.get(data, 'outcome', {});
        this.total = _.get(data, 'total', 0);
    }
}
