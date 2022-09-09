import { IV2ColumnExpandRow } from './column.model';

/**
 * Row types
 * - needs to have string values - they are unique when comparing, otherwise the same prop might exist on other objects with the same value number if we don't specify strings
 */
export enum V2RowType {
  EXPAND_ROW = 'expand_row'
}

/**
 * Expand row
 */
export interface IV2RowExpandRow {
  // required
  type: V2RowType.EXPAND_ROW;
  visible: boolean;
  column: IV2ColumnExpandRow;
  rowData: any;
}

/**
 * Type of rows
 */
export type V2Row = IV2RowExpandRow;
