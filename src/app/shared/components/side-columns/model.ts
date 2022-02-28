/**
 * Column pinned
 */
export enum VisibleColumnModelPinned {
  LEFT = 'left',
  RIGHT = 'right'
}

/**
 * Format
 */
export enum VisibleColumnModelFormat {
  AGE,
  DATE,
  DATETIME,
  BOOLEAN
}

/**
 * Visible column
 */
export class VisibleColumnModel {
  // required
  field: string;

  // optional
  label: string;
  required: boolean = false;
  visible: boolean = true;
  excludeFromSave: boolean = false;
  excludeFromDisplay: (VisibleColumnModel) => boolean;
  pinned: VisibleColumnModelPinned | boolean = false;
  format: string | VisibleColumnModelFormat | ((item: any) => string);
  formatField: string;
  formatValue: (item: any) => any;
  link: (any) => string;

  /**
     * Constructor
     * @param data
     */
  constructor(data: {
    // required
    field: string,

    // optional
    label?: string,
    required?: boolean,
    visible?: boolean,
    excludeFromSave?: boolean,
    excludeFromDisplay?: (VisibleColumnModel) => boolean,
    pinned?: VisibleColumnModelPinned | boolean,
    format?: string | VisibleColumnModelFormat | ((item: any) => string),
    formatField?: string,
    formatValue?: (item: any) => any,
    link?: (any) => string
  }) {
    // assign properties
    Object.assign(
      this,
      data
    );
  }
}

