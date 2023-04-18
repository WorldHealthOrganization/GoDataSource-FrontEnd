import { SafeHtml } from '@angular/platform-browser';

/**
 * Column type
 */
export enum CreateViewModifyV2ExpandColumnType {
  TEXT,
  STATUS_AND_DETAILS
}

/**
 * Text Column
 */
interface ICreateViewModifyV2ExpandColumnText {
  // required
  type: CreateViewModifyV2ExpandColumnType.TEXT;
  link: (item: any) => string[];
  get: {
    // required
    text: (item: any) => string,

    // optional
    details?: never,
    status?: never
  };

  // never
  statusVisible?: never;
  maxNoOfStatusForms?: never;
}

/**
 * Status and details column
 */
interface ICreateViewModifyV2ExpandColumnStatusAndDetails {
  // required
  type: CreateViewModifyV2ExpandColumnType.STATUS_AND_DETAILS;
  link: (item: any) => string[];
  get: {
    text: (item: any) => string,
    details: (item: any) => string,
    status: (item: any) => SafeHtml
  };
  statusVisible: boolean;
  maxNoOfStatusForms: number;
}

/**
 * Column types
 */
export type CreateViewModifyV2ExpandColumn = ICreateViewModifyV2ExpandColumnText | ICreateViewModifyV2ExpandColumnStatusAndDetails;
