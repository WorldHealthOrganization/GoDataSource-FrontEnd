import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { DashboardDashlet, DashboardKpiGroup } from '../../../core/enums/dashboard.enum';
import { Params } from '@angular/router';
import { Moment } from '../../../core/helperClasses/localization-helper';

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
  group: DashboardKpiGroup;
  prefix: string;
  refresh: (
    inputValue: number,
    globalDate: string | Moment,
    globalLocationId: string,
    globalClassifications: string[]
  ) => Observable<any>;
  process: (observerResponse: any) => string;
  hasPermission: () => boolean;
  valueColor: string;
  getLink: (
    inputValue: number,
    globalDate: string | Moment,
    globalLocationId: string,
    globalClassifications: string[]
  ) => {
    // required
    link: string[];

    // optional
    linkQueryParams?: Params;
  };
  helpTooltip: string;

  // optional
  prefixData?: () => {
    [prop: string]: string
  };
  suffix?: string;
  value?: string;
  status?: DashletValueStatus;
  subscription?: Subscription;
  reload?: number;
  inputValue?: number;
  link?: string[];
  linkQueryParams?: Params;
}
