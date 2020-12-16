import * as _ from 'lodash';
import { Moment, moment } from '../../helperClasses/x-moment';

export class MetricCasesCountStratified {
    start: Moment;
    end: Moment;
    classification: {
        [classificationId: string]: number
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

        this.classification = _.get(data, 'classification', {});
        this.total = _.get(data, 'total', 0);
    }
}
