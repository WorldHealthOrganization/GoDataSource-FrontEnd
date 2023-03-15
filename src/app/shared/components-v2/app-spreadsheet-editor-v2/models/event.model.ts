/**
 * Save event data
 */
export interface IV2SpreadsheetEditorEventSave {
  // required
  rows: {
    full: any,
    dirty: any
  }[];
  finished: () => void;
  removeRows: (rowsToDelete: number[]) => void;
}
