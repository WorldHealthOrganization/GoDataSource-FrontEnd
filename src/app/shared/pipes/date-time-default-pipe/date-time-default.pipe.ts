import { Pipe, PipeTransform } from '@angular/core';
import { LocalizationHelper } from '../../../core/helperClasses/localization-helper';

@Pipe({
  name: 'dateTimeDefault'
})
export class DateTimeDefaultPipe implements PipeTransform {
  transform(value: any): any {
    return value ? LocalizationHelper.displayDateTime(value) : '';
  }
}
