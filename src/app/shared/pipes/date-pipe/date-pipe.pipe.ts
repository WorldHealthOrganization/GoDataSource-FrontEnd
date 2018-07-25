import { Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';

@Pipe({
    name: 'dateMDY'
})
export class CustomDatePipe implements PipeTransform {

    transform(value: any): any {
        return value ? moment(value).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '';
    }

}
