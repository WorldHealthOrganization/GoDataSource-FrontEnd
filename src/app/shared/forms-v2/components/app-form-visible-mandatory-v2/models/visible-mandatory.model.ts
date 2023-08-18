/**
 * Used by create/view/modify input to configure specific things for visible/mandatory
 */
export interface ICreateViewModifyV2TabInputToVisibleMandatoryConf {
  // required
  alwaysRequired: boolean;
}

/**
 * Visible / Mandatory accepted value format
 */
export interface IVisibleMandatoryDataValue {
  [groupId: string]: {
    [fieldId: string]: {
      visible?: boolean,
      mandatory?: boolean
    }
  };
}

/**
 * Used for input data - group tab section field
 */
export interface IVisibleMandatoryDataGroupTabSectionField {
  // required
  id: string;
  label: string;
  visibleMandatoryConf: ICreateViewModifyV2TabInputToVisibleMandatoryConf;
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
