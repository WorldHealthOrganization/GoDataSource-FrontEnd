import { ColDef } from '@ag-grid-community/core';
import { V2SpreadsheetEditorColumn } from './column.model';
import { Moment } from 'moment';

/**
 Extended AG-Grid column definition - selection range collecting
 */
interface IV2SpreadsheetEditorExtendedColDefEditorSelectionRangeCollecting {
  startingPoint: {
    row: number,
    column: number
  };
  range: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange;
}

/**
 * Extended AG-Grid column definition - selection range
 */
export interface IV2SpreadsheetEditorExtendedColDefEditorSelectionRange {
  rows: {
    start: number,
    end: number
  },
  columns: {
    start: number,
    end: number
  }
}

/**
 * Extended AG-Grid column definition - editor
 */
export interface IV2SpreadsheetEditorExtendedColDefEditor {
  // columns map
  columnsMap: {
    [field: string]: {
      index: number,
      columnDefinition: V2SpreadsheetEditorColumn
    }
  };

  // location name caching
  locationNamesMap: {
    [locationId: string]: string
  };

  // selection range handlers
  selection: {
    // data
    selected: {
      // collecting range
      collecting: IV2SpreadsheetEditorExtendedColDefEditorSelectionRangeCollecting,
      previousCollecting: IV2SpreadsheetEditorExtendedColDefEditorSelectionRangeCollecting,
      outTime: Moment,

      // filling
      fill: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange,

      // selected ranges
      ranges: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange[]
    },

    // events
    cell: {
      mouseDown: (
        row: number,
        column: number,
        ctrlKey: boolean,
        shiftKey: boolean
      ) => void,
      mouseUp: () => void,
      mouseLeave: () => void,
      mouseEnter: (
        row: number,
        column: number,
        primaryButtonStillDown: boolean
      ) => void,
      fill: () => void
    },
    header: {
      // row no
      left: {
        mouseDown: (
          row: number,
          ctrlKey: boolean,
          shiftKey: boolean
        ) => void,
        mouseUp: () => void,
        mouseLeave: () => void,
        mouseEnter: (
          row: number,
          primaryButtonStillDown: boolean
        ) => void
      },

      // column headers
      top: {
        mouseDown: (
          column: number,
          ctrlKey: boolean,
          shiftKey: boolean
        ) => void,
        mouseUp: () => void,
        mouseLeave: () => void,
        mouseEnter: (
          column: number,
          primaryButtonStillDown: boolean
        ) => void
      }
    }
  };
}

/**
 * Extended AG-Grid column definition
 */
export interface IV2SpreadsheetEditorExtendedColDef extends ColDef {
  // required
  editor: IV2SpreadsheetEditorExtendedColDefEditor;

  // optional
  columnDefinition?: V2SpreadsheetEditorColumn;
}
