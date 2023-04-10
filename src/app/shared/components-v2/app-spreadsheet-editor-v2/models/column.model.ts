import { ITextCellEditorParams } from '@ag-grid-community/core';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { AppSpreadsheetEditorV2EditorSingleSelectComponent } from '../components/editor-single-select/app-spreadsheet-editor-v2-editor-single-select.component';
import { AppSpreadsheetEditorV2EditorDateComponent } from '../components/editor-date/app-spreadsheet-editor-v2-editor-date.component';
import { AppSpreadsheetEditorV2EditorLocationComponent } from '../components/editor-location/app-spreadsheet-editor-v2-editor-location.component';
import { AppSpreadsheetEditorV2EditorNumberComponent } from '../components/editor-number/app-spreadsheet-editor-v2-editor-number.component';
import { IV2SpreadsheetEditorExtendedColDefEditorColumnMap } from './extended-column.model';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { V2SpreadsheetEditorChange } from './change.model';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { AppSpreadsheetEditorV2CellBasicRendererModel } from './app-spreadsheet-editor-v2-cell-basic-renderer.model';
import { AppSpreadsheetEditorV2CellSelectRendererModel } from './app-spreadsheet-editor-v2-cell-select-renderer.model';
import { AppSpreadsheetEditorV2CellDateRendererModel } from './app-spreadsheet-editor-v2-cell-date-renderer.model';
import { AppSpreadsheetEditorV2CellLocationRendererModel } from './app-spreadsheet-editor-v2-cell-location-renderer.model';

/**
 * Editor handler
 */
export interface IV2SpreadsheetEditorHandler {
  // required
  rowValidate(rowIndex: number): void;
  redraw(): void;
  addChange(change: V2SpreadsheetEditorChange): void;
}

/**
 * Editor event data - location
 */
export interface IV2SpreadsheetEditorEventDataLocation {
  // required
  id: string;
  label: string;
  geoLocation: {
    lat: number,
    lng: number
  };
  name: string;
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
  locationsMap: {
    [locationId: string]: IV2SpreadsheetEditorEventDataLocation
  };
  change: V2SpreadsheetEditorChange;
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
 * Validator - email
 */
export interface IV2SpreadsheetEditorColumnValidatorEmail {
  // optional
  email?: (rowData: any) => boolean;
}

/**
 * Validator - date
 */
export interface IV2SpreadsheetEditorColumnValidatorDate {
  // optional
  date?: (rowData: any) => {
    min?: Moment,
    max?: Moment
  };
}

/**
 * Column type
 */
export enum V2SpreadsheetEditorColumnType {
  TEXT,
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

  // optional
  visible?: boolean;
  readonly?: (rowData: any) => boolean;

  // never
  editor?: never;
  optionsMap?: never;
  validators?: never;
  change?: never;
}

/**
 * Column - text
 */
export interface IV2SpreadsheetEditorColumnText extends Omit<IV2SpreadsheetEditorColumnBase, 'editor' | 'change' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.TEXT;

  // optional
  editor?: {
    params?: ITextCellEditorParams
  };
  change?: (data: IV2SpreadsheetEditorEventData) => void;
  validators?: IV2SpreadsheetEditorColumnValidatorRequired | IV2SpreadsheetEditorColumnValidatorAsync | IV2SpreadsheetEditorColumnValidatorEmail;
}

/**
 * Column - dropdown
 */
export interface IV2SpreadsheetEditorColumnSingleSelect extends Omit<IV2SpreadsheetEditorColumnBase, 'optionsMap' | 'change' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.SINGLE_SELECT;
  options: ILabelValuePairModel[];

  // optional
  change?: (data: IV2SpreadsheetEditorEventData) => void;
  validators?: IV2SpreadsheetEditorColumnValidatorRequired;

  // used by ui
  optionsMap?: {
    [key: string]: ILabelValuePairModel
  };
}

/**
 * Column - date
 */
export interface IV2SpreadsheetEditorColumnDate extends Omit<IV2SpreadsheetEditorColumnBase, 'change' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.DATE;

  // optional
  change?: (data: IV2SpreadsheetEditorEventData) => void;
  validators?: IV2SpreadsheetEditorColumnValidatorRequired | IV2SpreadsheetEditorColumnValidatorDate;
}

/**
 * Column - location
 */
export interface IV2SpreadsheetEditorColumnLocation extends Omit<IV2SpreadsheetEditorColumnBase, 'change' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.LOCATION;

  // optional
  change?: (data: IV2SpreadsheetEditorEventData) => void;
  validators?: IV2SpreadsheetEditorColumnValidatorRequired;
}

/**
 * Column - number
 */
export interface IV2SpreadsheetEditorColumnNumber extends Omit<IV2SpreadsheetEditorColumnBase, 'change' | 'validators'> {
  // required
  type: V2SpreadsheetEditorColumnType.NUMBER;

  // optional
  change?: (data: IV2SpreadsheetEditorEventData) => void;
  validators?: IV2SpreadsheetEditorColumnValidatorRequired | IV2SpreadsheetEditorColumnValidatorInteger;
}

/**
 * Column types
 */
export type V2SpreadsheetEditorColumn = IV2SpreadsheetEditorColumnText | IV2SpreadsheetEditorColumnSingleSelect | IV2SpreadsheetEditorColumnDate
| IV2SpreadsheetEditorColumnLocation | IV2SpreadsheetEditorColumnNumber;

/**
 * Renderers
 */
export const V2SpreadsheetEditorColumnTypeToRenderer: {
  [type in V2SpreadsheetEditorColumnType]: typeof AppSpreadsheetEditorV2CellBasicRendererModel
} = {
  [V2SpreadsheetEditorColumnType.TEXT]: AppSpreadsheetEditorV2CellBasicRendererModel,
  [V2SpreadsheetEditorColumnType.SINGLE_SELECT]: AppSpreadsheetEditorV2CellSelectRendererModel,
  [V2SpreadsheetEditorColumnType.DATE]: AppSpreadsheetEditorV2CellDateRendererModel,
  [V2SpreadsheetEditorColumnType.LOCATION]: AppSpreadsheetEditorV2CellLocationRendererModel,
  [V2SpreadsheetEditorColumnType.NUMBER]: AppSpreadsheetEditorV2CellBasicRendererModel
};

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
