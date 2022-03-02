import { Params } from '@angular/router';

/**
 * Page breadcrumb
 */
export interface IV2Breadcrumb {
  // required
  label: string;
  action: {
    // required
    link: string[],

    // optional
    linkQueryParams?: Params
  };

  // optional
  // ...
}
