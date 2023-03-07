/**
 * Change type
 */
export enum V2SpreadsheetEditorChangeType {
  ADD_ROWS,
  REMOVE_ROWS,
  VALUES
}

/**
 * Change - add rows
 */
export interface IV2SpreadsheetEditorChangeAddRows {
  // required
  type: V2SpreadsheetEditorChangeType.ADD_ROWS;
  before: any[];
}

/**
 * Change - remove rows
 */
export interface IV2SpreadsheetEditorChangeRemoveRows {
  // required
  type: V2SpreadsheetEditorChangeType.REMOVE_ROWS;
  before: any[];
}

/**
 * Change - values
 */
export interface IV2SpreadsheetEditorChangeValues {
  // required
  type: V2SpreadsheetEditorChangeType.VALUES;
  changes: {
    rows: {
      [rowIndex: number]: {
        columns: {
          [columnIndex: number]: {
            old: any,
            new: any
          }
        }
      }
    }
  };
}

/**
 * Changes
 */
export type V2SpreadsheetEditorChange = IV2SpreadsheetEditorChangeAddRows | IV2SpreadsheetEditorChangeRemoveRows | IV2SpreadsheetEditorChangeValues;
