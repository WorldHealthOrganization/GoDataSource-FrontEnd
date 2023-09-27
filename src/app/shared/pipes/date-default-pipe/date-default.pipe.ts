import { Pipe, PipeTransform } from '@angular/core';
import { LocalizationHelper } from '../../../core/helperClasses/localization-helper';

@Pipe({
  name: 'dateDefault'
})
export class DateDefaultPipe implements PipeTransform {
  transform(value: any): any {
    return value ? LocalizationHelper.displayDate(value) : '';
  }
}
