import { Params } from '@angular/router';

/**
 * Page breadcrumb action
 */
export interface IV2BreadcrumbAction {
  // required
  link: string[];

  // optional
  linkQueryParams?: Params;
}

/**
 * Page breadcrumb
 */
export interface IV2Breadcrumb {
  // required
  label: string;
  action: IV2BreadcrumbAction;

  // optional
  // ...
}
