import { ILargeTextEditorParams, ITextCellEditorParams } from '@ag-grid-community/core';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { AppSpreadsheetEditorV2EditorSingleSelectComponent } from '../components/editor-single-select/app-spreadsheet-editor-v2-editor-single-select.component';
import { AppSpreadsheetEditorV2EditorDateComponent } from '../components/editor-date/app-spreadsheet-editor-v2-editor-date.component';
import { AppSpreadsheetEditorV2EditorLocationComponent } from '../components/editor-location/app-spreadsheet-editor-v2-editor-location.component';
import { AppSpreadsheetEditorV2EditorNumberComponent } from '../components/editor-number/app-spreadsheet-editor-v2-editor-number.component';
import { IV2SpreadsheetEditorExtendedColDefEditorColumnMap } from './extended-column.model';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';

/**
 * Editor handler
 */
export interface IV2SpreadsheetEditorHandler {
  // required
  rowValidate(rowIndex: number): void;
  cellReadonly(rowIndex: number, columnIndex: number, readonly: boolean): void;
}

/**
 * Editor event data
 */
export interface IV2SpreadsheetEditorEventData {
  // required
  rowIndex: number;
  columnIndex: number;
  rowData: any;
  handler: IV2SpreadsheetEditorHandler;
  columnsMap: IV2SpreadsheetEditorExtendedColDefEditorColumnMap;
}

/**
 * Event types
 */
export enum V2SpreadsheetEditorEventType {
  CHANGE
}

/**
 * Validator - required
 */
export interface IV2SpreadsheetEditorColumnValidatorRequired {
  // optional
  required?: (rowData: any) => boolean;
}

/**
 * Validator - integer
 */
export interface IV2SpreadsheetEditorColumnValidatorInteger {
  // optional
  integer?: (rowData: any) => {
    min?: number,
    max?: number
  };
}

/**
 * Validator - async
 */
export interface IV2SpreadsheetEditorColumnValidatorAsync {
  // optional
  async?: (rowData: any) => Observable<boolean | IGeneralAsyncValidatorResponse>;
}

/**
 * Column type
 */
export enum V2SpreadsheetEditorColumnType {
  TEXT,
  TEXTAREA,
  SINGLE_SELECT,
  DATE,
  LOCATION,
  NUMBER
}

/**
 * Column - base
 */
interface IV2SpreadsheetEditorColumnBase {
  // required
  type: V2SpreadsheetEditorColumnType;
  field: string;
  label: string;

  // never
  editor?: never;
  optionsMap?: never;
  validators?: never;
  change?: never;
}

/**
 * Column - text
 */
export interface IV2SpreadsheetEditorColumnText extends Omit<IV2SpreadsheetEditorColumnBase, 'editor' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.TEXT;

  // optional
  editor?: {
    params?: ITextCellEditorParams
  };
  validators?: IV2SpreadsheetEditorColumnValidatorRequired | IV2SpreadsheetEditorColumnValidatorAsync;
}

/**
 * Column - textarea
 */
export interface IV2SpreadsheetEditorColumnTextarea extends Omit<IV2SpreadsheetEditorColumnBase, 'editor'> {
  // required
  type: V2SpreadsheetEditorColumnType.TEXTAREA;

  // optional
  editor?: {
    params?: ILargeTextEditorParams
  };
}

/**
 * Column - dropdown
 */
export interface IV2SpreadsheetEditorColumnSingleSelect extends Omit<IV2SpreadsheetEditorColumnBase, 'optionsMap' | 'change'> {
  // required
  type: V2SpreadsheetEditorColumnType.SINGLE_SELECT;
  options: ILabelValuePairModel[];

  // used by ui
  optionsMap?: {
    [key: string]: ILabelValuePairModel
  };
  change?: (data: IV2SpreadsheetEditorEventData) => void;
}

/**
 * Column - date
 */
export interface IV2SpreadsheetEditorColumnDate extends IV2SpreadsheetEditorColumnBase {
  // required
  type: V2SpreadsheetEditorColumnType.DATE;
}

/**
 * Column - location
 */
export interface IV2SpreadsheetEditorColumnLocation extends IV2SpreadsheetEditorColumnBase {
  // required
  type: V2SpreadsheetEditorColumnType.LOCATION;
}

/**
 * Column - number
 */
export interface IV2SpreadsheetEditorColumnNumber extends Omit<IV2SpreadsheetEditorColumnBase, 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.NUMBER;

  // optional
  validators?: IV2SpreadsheetEditorColumnValidatorInteger;
}

/**
 * Column types
 */
export type V2SpreadsheetEditorColumn = IV2SpreadsheetEditorColumnText | IV2SpreadsheetEditorColumnTextarea | IV2SpreadsheetEditorColumnSingleSelect | IV2SpreadsheetEditorColumnDate
| IV2SpreadsheetEditorColumnLocation | IV2SpreadsheetEditorColumnNumber;

/**
 * Supported editors
 */
export const V2SpreadsheetEditorColumnTypeToEditor: {
  [type in V2SpreadsheetEditorColumnType]: {
    // required
    type: string |
      typeof AppSpreadsheetEditorV2EditorSingleSelectComponent |
      typeof AppSpreadsheetEditorV2EditorDateComponent |
      typeof AppSpreadsheetEditorV2EditorLocationComponent |
      typeof AppSpreadsheetEditorV2EditorNumberComponent
  }
} = {
  [V2SpreadsheetEditorColumnType.TEXT]: {
    type: 'agTextCellEditor'
  },
  [V2SpreadsheetEditorColumnType.TEXTAREA]: {
    type: 'agLargeTextCellEditor'
  },
  [V2SpreadsheetEditorColumnType.SINGLE_SELECT]: {
    type: AppSpreadsheetEditorV2EditorSingleSelectComponent
  },
  [V2SpreadsheetEditorColumnType.DATE]: {
    type: AppSpreadsheetEditorV2EditorDateComponent
  },
  [V2SpreadsheetEditorColumnType.LOCATION]: {
    type: AppSpreadsheetEditorV2EditorLocationComponent
  },
  [V2SpreadsheetEditorColumnType.NUMBER]: {
    type: AppSpreadsheetEditorV2EditorNumberComponent
  }
};
