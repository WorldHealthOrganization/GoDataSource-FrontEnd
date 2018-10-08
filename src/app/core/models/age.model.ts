import * as _ from 'lodash';
import { Moment } from 'moment';
import { FormDatepickerComponent } from '../../shared/xt-forms/components/form-datepicker/form-datepicker.component';
import * as moment from 'moment';

export class AgeModel {
    years: number;
    months: number;

    constructor(data = null) {
        // years
        this.years = _.get(data, 'years');
        this.years = this.years < 1 ? undefined : this.years;

        // months
        this.months = _.get(data, 'months');
        this.months = this.months < 1 ? undefined : this.months;
    }

    /**
     * Add missing information
     * @param result
     * @param dobComponent
     * @param date
     */
    static addAgeFromDob(
        result: any,
        dobComponent: FormDatepickerComponent,
        date: Moment
    ) {
        if (
            (
                !dobComponent ||
                !dobComponent.invalid
            ) &&
            date &&
            date.isValid()
        ) {
            // add age object if we don't have one
            if (!result.age) {
                result.age = new AgeModel();
            }

            // add data
            const now = moment();
            result.age.years = now.diff(date, 'years');
            result.age.months = result.age.years < 1 ? now.diff(date, 'months') : 0;
            result.age.years = result.age.years < 1 ? undefined : result.age.years;
            result.age.months = result.age.months < 1 ? undefined : result.age.months;
        } else {
            result.age.months = undefined;
            result.age.years = undefined;
        }
    }
}
