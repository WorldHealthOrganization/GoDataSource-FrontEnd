import { ColDef } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorEventDataLocation, V2SpreadsheetEditorColumn } from './column.model';
import { CreateViewModifyV2Action } from '../../app-create-view-modify-v2/models/action.model';
import { AppFormBaseErrorMsgV2Type } from '../../../forms-v2/core/app-form-base-error-msg-v2';
import { Subscription } from 'rxjs';
import { Moment } from '../../../../core/helperClasses/localization-helper';
import { IGeneralAsyncValidatorResponse } from '../../../forms-v2/validators/general-async-validator.directive';

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
 * Extended AG-Grid column definition - editor columns map
 */
export interface IV2SpreadsheetEditorExtendedColDefEditorColumnMap {
  [field: string]: {
    index: number,
    columnDefinition: V2SpreadsheetEditorColumn
  }
}

/**
 * Extended AG-Grid column definition - editor error
 */
export interface IV2SpreadsheetEditorExtendedColDefEditorError {
  key: AppFormBaseErrorMsgV2Type,
  data?: any
}

/**
 * Extended AG-Grid column definition - editor
 */
export interface IV2SpreadsheetEditorExtendedColDefEditor {
  // setup
  action: CreateViewModifyV2Action.CREATE | CreateViewModifyV2Action.MODIFY,

  // helpers
  helpers: {
    date: (value: string) => string,
    translate: (value: string) => string,
    openMenu: (event: PointerEvent) => void
  },

  // columns map
  columnsMap: IV2SpreadsheetEditorExtendedColDefEditorColumnMap,

  // location name caching
  locationsMap: {
    [locationId: string]: IV2SpreadsheetEditorEventDataLocation
  };

  // help details
  errorRows: string,
  refreshErrorRowsCell: () => void,

  // invalid
  invalid: {
    rows: {
      [rowIndex: number]: {
        columns: {
          [columnIndex: number]: {
            error: IV2SpreadsheetEditorExtendedColDefEditorError
          }
        }
      }
    }
  },

  // async request
  async: {
    inProgress: boolean,
    rows: {
      [rowIndex: number]: {
        columns: {
          [columnIndex: number]: {
            subscription: Subscription
          }
        }
      }
    }
  },
  asyncResponses: {
    rows: {
      [rowIndex: number]: {
        columns: {
          [columnIndex: number]: {
            [checkedValue: string]: boolean | IGeneralAsyncValidatorResponse
          }
        }
      }
    }
  },

  // dirty
  dirty: {
    rows: {
      [rowIndex: number]: {
        columns: {
          [columnIndex: number]: true
        }
      }
    }
  },

  // row has data ?
  hasData: {
    rows: {
      [rowIndex: number]: true
    }
  },

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
      mouseMove: (event: MouseEvent) => void,
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
        ) => void,
        mouseMove: (event: MouseEvent) => void
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
        ) => void,
        mouseMove: (
          pivotCell: boolean,
          event: MouseEvent
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
