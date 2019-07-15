import * as _ from 'lodash';
import { Moment } from '../helperClasses/x-moment';

export class DateRangeModel {
    startDate: string | Moment;
    endDate: string | Moment;

    constructor(data = null) {
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
    }
}
