import { Moment } from '../../../../../core/helperClasses/x-moment';

/**
 * Date range model
 */
export interface IV2DateRange {
  startDate: string | Moment | Date;
  endDate: string | Moment | Date;
}
