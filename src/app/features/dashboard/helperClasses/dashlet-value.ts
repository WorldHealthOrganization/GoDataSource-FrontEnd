import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';

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
  prefix: string;
  refresh: (inputValue: number) => Observable<any>;
  process: (observerResponse: any) => string;

  // optional
  suffix?: string;
  value?: string;
  status?: DashletValueStatus;
  subscription?: Subscription;
  reload?: any;
  inputValue?: number;
}
