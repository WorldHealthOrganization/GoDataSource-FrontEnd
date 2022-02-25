export enum VisibleColumnModelPinned {
  LEFT = 'left',
  RIGHT = 'right'
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
    pinned?: VisibleColumnModelPinned | boolean
  }) {
    // assign properties
    Object.assign(
      this,
      data
    );
  }
}

