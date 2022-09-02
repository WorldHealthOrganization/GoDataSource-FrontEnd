import { Params } from '@angular/router';

/**
 * Column type
 */
export enum CreateViewModifyV2ExpandColumnType {
  TEXT
}

/**
 * Text Column
 */
interface ICreateViewModifyV2ExpandColumnText {
  // required
  type: CreateViewModifyV2ExpandColumnType.TEXT;
  get: (item: any) => string;
  link: (item: any) => string[];

  // optional
  linkQueryParams?: (item: any) => Params;
}

/**
 * Column types
 */
export type CreateViewModifyV2ExpandColumn = ICreateViewModifyV2ExpandColumnText;
