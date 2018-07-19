import * as _ from 'lodash';

export class DateRangeModel {
    startDate: string;
    endDate: string;

    constructor(data = null) {
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
    }
}
