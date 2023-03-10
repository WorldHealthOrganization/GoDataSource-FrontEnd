/**
 * Save event data
 */
export interface IV2SpreadsheetEditorEventSave {
  // required
  rows: any[];
  finished: () => void;
}
