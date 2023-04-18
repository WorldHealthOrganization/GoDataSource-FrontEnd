/**
 * Change type
 */
export enum V2SpreadsheetEditorChangeType {
  VALUES
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
export type V2SpreadsheetEditorChange = IV2SpreadsheetEditorChangeValues;
