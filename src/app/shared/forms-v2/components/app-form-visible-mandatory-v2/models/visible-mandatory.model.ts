import { CreateViewModifyV2TabInput } from '../../../../components-v2/app-create-view-modify-v2/models/tab.model';
import { IV2Column } from '../../../../components-v2/app-list-table-v2/models/column.model';

/**
 * Used by lists to configure specific things for visible/mandatory
 */
export type IV2ColumnToVisibleMandatoryConf = IV2Column & {
  // required
  visibleMandatoryIf: () => boolean;
};

/**
 * Used by create/view/modify input to configure specific things for visible/mandatory
 */
export interface ICreateViewModifyV2TabInputToVisibleMandatoryConf {
  // required
  visible: boolean;
  required: boolean;
}

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
  definition: CreateViewModifyV2TabInput;
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
