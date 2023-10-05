import { Moment } from '../../../../../core/helperClasses/localization-helper';

/**
 * Date range model
 */
export interface IV2DateRange {
  startDate: string | Moment | Date;
  endDate: string | Moment | Date;
}
