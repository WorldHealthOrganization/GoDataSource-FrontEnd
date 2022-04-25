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
  type: CreateViewModifyV2ExpandColumnType.TEXT;
  get: (item: any) => string
}

/**
 * Column types
 */
export type CreateViewModifyV2ExpandColumn = ICreateViewModifyV2ExpandColumnText;
