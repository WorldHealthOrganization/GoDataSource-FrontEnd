import * as _ from 'lodash';

export class AgeModel {
    years: number;
    months: number;

    constructor(data = null) {
        // years
        this.years = _.get(data, 'years', 0);

        // months
        this.months = _.get(data, 'months', 0);
    }
}
