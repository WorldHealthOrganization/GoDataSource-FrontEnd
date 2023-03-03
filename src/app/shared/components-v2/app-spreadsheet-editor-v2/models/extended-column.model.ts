import { ColDef } from '@ag-grid-community/core';
import { V2SpreadsheetEditorColumn } from './column.model';

/**
 * Extended AG-Grid column definition
 */
export interface IV2SpreadsheetEditorExtendedColDef extends ColDef {
  // required
  editor: {
    // location name caching
    locationNamesMap: {
      [locationId: string]: string
    }
  };

  // optional
  columnDefinition?: V2SpreadsheetEditorColumn;
}
