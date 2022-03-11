import { V2Action } from './action.model';

/**
 * Column pinned
 */
export enum IV2ColumnPinned {
  LEFT = 'left',
  RIGHT = 'right'
}

/**
 * Format value
 */
export interface IV2ColumnBasicFormatType {
  // format
  type: string | ((item: any) => string);
}

/**
 * Format value
 */
export interface IV2ColumnBasicFormat extends IV2ColumnBasicFormatType {
  // optional
  field?: string;
  value?: (item: any) => any;
}

/**
 * Basic column
 */
export interface IV2ColumnBasic {
  // required
  field: string;
  label: string;

  // optional
  format?: IV2ColumnBasicFormat;
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  link?: (any) => string;
  cssCellClasses?: string;
}

/**
 * Format
 */
export enum V2ColumnFormat {
  BUTTON,
  AGE,
  DATE,
  DATETIME,
  BOOLEAN,
  ACTIONS
}

/**
 * Age column
 */
interface IV2ColumnAge extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.AGE
  };
}

/**
 * Date column
 */
interface IV2ColumnDate extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.DATE
  };
}

/**
 * Datetime column
 */
interface IV2ColumnDatetime extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.DATETIME
  };
}

/**
 * Boolean column
 */
interface IV2ColumnBoolean extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.BOOLEAN
  };
}

/**
 * Button column
 */
export interface IV2ColumnButton {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.BUTTON
  };
  field: string;
  label: string;
  buttonLabel: (data: any) => string;
  color: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  click: (data: any) => void;

  // optional
  disabled?: (data: any) => boolean;
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  cssCellClasses?: string;
}

/**
 * Action column
 */
export interface IV2ColumnAction {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.ACTIONS
  };
  field: string;
  label: string;
  actions: V2Action[];

  // optional
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  cssCellClasses?: string;
}

/**
 * Column
 */
export type IV2Column = IV2ColumnBasic | IV2ColumnButton | IV2ColumnAge | IV2ColumnDate | IV2ColumnDatetime | IV2ColumnBoolean | IV2ColumnAction;
