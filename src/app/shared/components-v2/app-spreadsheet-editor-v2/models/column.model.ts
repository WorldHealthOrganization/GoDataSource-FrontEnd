import { ILargeTextEditorParams, ITextCellEditorParams } from '@ag-grid-community/core';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { AppSpreadsheetEditorV2EditorSingleSelectComponent } from '../components/editor-single-select/app-spreadsheet-editor-v2-editor-single-select.component';
import { AppSpreadsheetEditorV2EditorDateComponent } from '../components/editor-date/app-spreadsheet-editor-v2-editor-date.component';
import { AppSpreadsheetEditorV2EditorLocationComponent } from '../components/editor-location/app-spreadsheet-editor-v2-editor-location.component';
import { AppSpreadsheetEditorV2EditorNumberComponent } from '../components/editor-number/app-spreadsheet-editor-v2-editor-number.component';

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
}

/**
 * Column - text
 */
export interface IV2SpreadsheetEditorColumnText extends Omit<IV2SpreadsheetEditorColumnBase, 'editor'> {
  // required
  type: V2SpreadsheetEditorColumnType.TEXT;

  // optional
  editor?: {
    params?: ITextCellEditorParams
  };
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
export interface IV2SpreadsheetEditorColumnSingleSelect extends Omit<IV2SpreadsheetEditorColumnBase, 'optionsMap'> {
  // required
  type: V2SpreadsheetEditorColumnType.SINGLE_SELECT;
  options: ILabelValuePairModel[];

  // used by ui
  optionsMap?: {
    [key: string]: ILabelValuePairModel
  };
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
export interface IV2SpreadsheetEditorColumnNumber extends IV2SpreadsheetEditorColumnBase {
  // required
  type: V2SpreadsheetEditorColumnType.NUMBER;
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
