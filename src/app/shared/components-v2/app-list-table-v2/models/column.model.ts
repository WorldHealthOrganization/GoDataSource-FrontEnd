import { V2Action } from './action.model';
import { V2Filter, IV2FilterDate } from './filter.model';

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
  cssCellClass?: string;
  sortable?: boolean;
  filter?: V2Filter;
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
  ACTIONS,
  STATUS
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

  // optional
  filter?: IV2FilterDate;
}

/**
 * Datetime column
 */
interface IV2ColumnDatetime extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.DATETIME
  };

  // optional
  // filter?: V2FilterDateTime;
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
  cssCellClass?: string;
  sortable?: boolean;
  filter?: V2Filter;
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
  cssCellClass?: string;
  sortable?: never;
  filter?: never;
}

/**
 * Status column form type
 */
export enum IV2ColumnStatusFormType {
  CIRCLE,
  SQUARE,
  TRIANGLE
}

/**
 * Status column form - shape
 */
interface IV2ColumnStatusFormShape {
  // required
  type: IV2ColumnStatusFormType.CIRCLE | IV2ColumnStatusFormType.SQUARE | IV2ColumnStatusFormType.TRIANGLE;
  color: string;
}

/**
 * Status column form
 */
export type V2ColumnStatusForm = IV2ColumnStatusFormShape;

/**
 * Status column - legend
 */
interface IV2ColumnLegendStatusItem {
  // required
  form: V2ColumnStatusForm;
  label: string;
}

/**
 * Status column - legend
 */
interface IV2ColumnLegend<T> {
  // required
  title: string;
  items: T[];
}

/**
 * Status column
 */
export interface IV2ColumnStatus {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.STATUS
  };
  notResizable: true;
  field: string;
  label: string;
  forms: (IV2ColumnStatus, data: any) => V2ColumnStatusForm[];
  legends: IV2ColumnLegend<IV2ColumnLegendStatusItem>[];

  // optional
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  cssCellClass?: string;
  sortable?: never;
  filter?: never;
}

/**
 * Column
 */
export type IV2Column = IV2ColumnBasic | IV2ColumnButton | IV2ColumnAge | IV2ColumnDate | IV2ColumnDatetime | IV2ColumnBoolean | IV2ColumnAction | IV2ColumnStatus;
