import { Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../../../core/models/constants';
import { LocalizationHelper } from '../../../core/helperClasses/localization-helper';

@Pipe({
  name: 'dateTimeDefault'
})
export class DateTimeDefaultPipe implements PipeTransform {
  transform(value: any): any {
    return value ? LocalizationHelper.toMoment(value).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '';
  }
}
