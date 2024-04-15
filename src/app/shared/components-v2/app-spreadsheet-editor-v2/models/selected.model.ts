/**
 * Selected matrix
 */
export interface IV2SpreadsheetEditorSelectedMatrix {
  // required
  minMax: {
    rows: {
      min: number,
      max: number
    },
    columns: {
      min: number,
      max: number
    }
  };
  matrix: {
    cells: {
      [rowIndex: number]: {
        [columnIndex: number]: true
      }
    },
    columns: {
      [columnIndex: number]: true
    }
  };
}
