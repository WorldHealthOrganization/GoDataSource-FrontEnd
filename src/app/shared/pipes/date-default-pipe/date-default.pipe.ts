import { Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';

@Pipe({
    name: 'dateDefault'
})
export class DateDefaultPipe implements PipeTransform {
    transform(value: any): any {
        return value ? moment.utc(value).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '';
    }
}
