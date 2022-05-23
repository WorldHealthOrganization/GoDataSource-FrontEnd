import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { Moment } from '../../../core/helperClasses/x-moment';
import { DashboardDashlet } from '../../../core/enums/dashboard.enum';

/**
 * Dashlet value status
 */
export enum DashletValueStatus {
  LOADING,
  LOADED,
  ERROR
}

/**
 * Dashlet value
 */
export interface IDashletValue {
  // required
  name: DashboardDashlet;
  prefix: string;
  refresh: (
    inputValue: number,
    globalDate: string | Moment,
    globalLocationId: string,
    globalClassifications: string[]
  ) => Observable<any>;
  process: (observerResponse: any) => string;

  // optional
  suffix?: string;
  value?: string;
  status?: DashletValueStatus;
  subscription?: Subscription;
  reload?: any;
  inputValue?: number;
}
