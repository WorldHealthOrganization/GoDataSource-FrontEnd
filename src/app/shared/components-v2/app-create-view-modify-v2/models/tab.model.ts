import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';

/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  // inputs
  TEXT,
  SELECT_SINGLE,

  // input groups
  LIST,

  // layout
  TAB,
  SECTION
}

/**
 * Input - base value
 */
interface CreateViewModifyV2TabInputValue<T> {
  get: () => T;
  set: (value: T) => void;
}

/**
 * Input - base
 */
interface CreateViewModifyV2TabInputBase {
  // required
  type: CreateViewModifyV2TabInputType;
  name: string;
  placeholder: string;

  // optional
  description?: string;
  disabled?: (item: CreateViewModifyV2TabInput) => boolean;

  // never
  value: never;
}

/**
 * Input - text
 */
interface CreateViewModifyV2TabInputText extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXT;
  value: CreateViewModifyV2TabInputValue<string>;
}

/**
 * Input - select single
 */
interface CreateViewModifyV2TabInputSingleSelect extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_SINGLE;
  options: ILabelValuePairModel[];
  value: CreateViewModifyV2TabInputValue<string>;
}

/**
* Input - list
*/
interface CreateViewModifyV2TabInputList {
  // required
  type: CreateViewModifyV2TabInputType.LIST;
  name: string;
  items: any[];
  definition: {
    inputs: CreateViewModifyV2TabInput[],
    add: {
      label: string,
      click: () => void
    },
    remove: {
      label: string
    }
  };
}

/**
 * Input
 */
type CreateViewModifyV2TabInput = CreateViewModifyV2TabInputText | CreateViewModifyV2TabInputSingleSelect | CreateViewModifyV2TabInputList;

/**
 * Tab section
 */
interface CreateViewModifyV2Section {
  // required
  type: CreateViewModifyV2TabInputType.SECTION;
  inputs: CreateViewModifyV2TabInput[];
  label: string;
}

/**
 * Tab
 */
export interface CreateViewModifyV2Tab {
  // required
  type: CreateViewModifyV2TabInputType.TAB;
  sections: CreateViewModifyV2Section[];
  label: string;
}
