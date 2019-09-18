import * as _ from 'lodash';
import { Moment } from 'moment';

export class VaccineModel {

    vaccine: string;
    date: string | Moment;
    status: string;

    constructor(data = null) {
        this.vaccine = _.get(data, 'vaccine');
        this.date = _.get(data, 'date');
        this.status = _.get(data, 'status');
    }
}
