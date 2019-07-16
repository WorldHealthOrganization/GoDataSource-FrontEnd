import { Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';

@Pipe({
    name: 'dateTimeDefault'
})
export class DateTimeDefaultPipe implements PipeTransform {
    transform(value: any): any {
        return value ? moment.utc(value).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '';
    }
}
