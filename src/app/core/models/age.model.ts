import * as _ from 'lodash';
import { Moment } from 'moment';
import { GenericDataService } from '../services/data/generic.data.service';
import { FormDatepickerComponent } from '../../shared/xt-forms/components/form-datepicker/form-datepicker.component';

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
     * @param serverToday
     * @param genericDataService
     */
    static addAgeFromDob(
        result: any,
        dobComponent: FormDatepickerComponent,
        date: Moment,
        serverToday: Moment,
        genericDataService: GenericDataService
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
            if (serverToday) {
                result.age.years = serverToday.diff(date, 'years');
                result.age.months = result.age.years < 1 ? serverToday.diff(date, 'months') : 0;
                result.age.years = result.age.years < 1 ? undefined : result.age.years;
                result.age.months = result.age.months < 1 ? undefined : result.age.months;
            } else {
                genericDataService
                    .getServerUTCToday()
                    .subscribe((curDate) => {
                        result.age.years = curDate.diff(date, 'years');
                        result.age.months = result.age.years < 1 ? curDate.diff(date, 'months') : 0;
                        result.age.years = result.age.years < 1 ? undefined : result.age.years;
                        result.age.months = result.age.months < 1 ? undefined : result.age.months;
                    });
            }
        } else {
            result.age.months = undefined;
            result.age.years = undefined;
        }
    }
}
