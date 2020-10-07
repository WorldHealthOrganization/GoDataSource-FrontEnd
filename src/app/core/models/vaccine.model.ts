import * as _ from 'lodash';
import { Moment } from 'moment';

export class VaccineModel {
    // data
    vaccine: string;
    date: string | Moment;
    status: string;

    /**
     * Constructor
     */
    constructor(data = null) {
        this.vaccine = _.get(data, 'vaccine');
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
    }
}
