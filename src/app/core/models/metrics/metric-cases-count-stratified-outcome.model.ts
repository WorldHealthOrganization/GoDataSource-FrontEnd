import * as _ from 'lodash';
import { moment, Moment } from '../../helperClasses/x-moment';

export class MetricCasesCountStratifiedOutcome {
    start: Moment;
    end: Moment;
    outcome: {
        [outcomeId: string]: number
    };
    total: number;

    constructor(data = null) {
        this.start = _.get(data, 'start');
        if (this.start) {
            this.start = moment(this.start);
        }

        this.end = _.get(data, 'end');
        if (this.end) {
            this.end = moment(this.end);
        }

        this.outcome = _.get(data, 'outcome', {});
        this.total = _.get(data, 'total', 0);
    }
}
