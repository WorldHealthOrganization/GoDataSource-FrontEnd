import { Moment } from 'moment';
import * as moment from 'moment';

export class ChronologyItem {
    public label: string;
    public date: string | Moment;
    public daysSincePreviousEvent: number;
    public translateData: {
        [key: string]: string
    } = {};

    constructor(data: {
        // required
        label: string,
        date: string | Moment,

        // optional
        translateData?: {
            [key: string]: string
        }
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );

        // make sure that date is a date :)
        this.date = this.date ? moment(this.date) : this.date;
    }
}
