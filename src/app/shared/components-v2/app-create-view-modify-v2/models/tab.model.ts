/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  // inputs
  TEXT,

  // input groups
  LIST,

  // layout
  TAB,
  SECTION
}

/**
 * Input - base
 */
interface CreateViewModifyV2TabInputBase {
  // required
  type: CreateViewModifyV2TabInputType;
  name: string;
  placeholder: string;

  // never
  value: never;
}

/**
 * Input - text
 */
interface CreateViewModifyV2TabInputText extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXT;

  // optional
  value?: string;
}

/**
* Input - list
*/
interface CreateViewModifyV2TabInputList {
  // required
  type: CreateViewModifyV2TabInputType.LIST;
  inputs: CreateViewModifyV2TabInput[];
}

/**
 * Input
 */
type CreateViewModifyV2TabInput = CreateViewModifyV2TabInputText | CreateViewModifyV2TabInputList;

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
