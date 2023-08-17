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
