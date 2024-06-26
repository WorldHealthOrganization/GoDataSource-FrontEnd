import { IV2Column } from '../../../../components-v2/app-list-table-v2/models/column.model';
import { V2AdvancedFilter } from '../../../../components-v2/app-list-table-v2/models/advanced-filter.model';
import { V2SpreadsheetEditorColumn } from '../../../../components-v2/app-spreadsheet-editor-v2/models/column.model';
import { QuickEditorV2Input } from '../../../../components-v2/app-quick-editor-v2/models/input.model';

/**
 * Used by quick editor to configure specific things for visible/mandatory columns
 */
export type QuickEditorV2InputToVisibleMandatoryConf = QuickEditorV2Input & {
  // required
  visibleMandatory: {
    // required
    key: string,
    field: string,

    // optional
    keepRequired?: boolean
  };
};

/**
 * Used by lists to configure specific things for visible/mandatory columns
 */
export type IV2ColumnToVisibleMandatoryConf = IV2Column & {
  // required
  visibleMandatoryIf: () => boolean;
};

/**
 * Used by lists to configure specific things for visible/mandatory advanced filters
 */
export type V2AdvancedFilterToVisibleMandatoryConf = V2AdvancedFilter & {
  // required
  visibleMandatoryIf: () => boolean;
};

/**
 * Used by create/view/modify input to configure specific things for visible/mandatory
 */
export interface ICreateViewModifyV2TabInputToVisibleMandatoryConf {
  // optional
  visible?: boolean;
  required?: boolean;
  originalName?: string;
  needs?: {
    // required
    field: string,

    // optional
    group?: string
  }[];
}

/**
 * Used by create/view/modify input to configure specific things for visible/mandatory
 */
export interface ICreateViewModifyV2TabInputToVisibleMandatorySectionConf {
  // optional
  dontFilter: boolean;
}

/**
 * Used by bulk create/modify input to configure specific things for visible/mandatory
 */
export type V2SpreadsheetEditorColumnToVisibleMandatoryConf = V2SpreadsheetEditorColumn & {
  // required
  visibleMandatory: {
    // required
    key: string,
    field: string,

    // optional
    keepRequired?: boolean
  };
};

/**
 * Visible / Mandatory accepted value format - field
 */
export interface IVisibleMandatoryDataValueField {
  visible?: boolean;
  mandatory?: boolean;
}

/**
 * Visible / Mandatory accepted value format
 */
export interface IVisibleMandatoryDataValue {
  [groupId: string]: {
    [fieldId: string]: IVisibleMandatoryDataValueField
  };
}

/**
 * Used for input data - group tab section field
 */
export interface IVisibleMandatoryDataGroupTabSectionField {
  // required
  id: string;
  label: string;
  supportsRequired: boolean;
  visibleMandatoryConf: ICreateViewModifyV2TabInputToVisibleMandatoryConf;
  inputHasRequiredValidator: boolean;
}

/**
 * Used for input data - group tab section
 */
export interface IVisibleMandatoryDataGroupTabSection {
  // required
  id: string;
  label: string;
  children: IVisibleMandatoryDataGroupTabSectionField[];

  // used by ui
  collapsed?: boolean;
}

/**
 * Used for input data - group tab
 */
export interface IVisibleMandatoryDataGroupTab {
  // required
  id: string;
  label: string;
  children: IVisibleMandatoryDataGroupTabSection[];

  // used by ui
  collapsed?: boolean;
}

/**
 * Used for input data - group
 */
export interface IVisibleMandatoryDataGroup {
  // required
  id: string;
  label: string;
  children: IVisibleMandatoryDataGroupTab[];

  // used by ui
  collapsed?: boolean;
}
