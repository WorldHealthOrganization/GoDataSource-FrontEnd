import { Moment } from 'moment';

export class ChronologyItem {
    public label: string;
    public date: string | Moment;
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
    }
}
