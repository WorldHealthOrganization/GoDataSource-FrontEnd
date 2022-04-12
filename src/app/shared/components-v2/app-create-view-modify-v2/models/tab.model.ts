/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  TEXT
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
 * Input
 */
export type CreateViewModifyV2TabInput = CreateViewModifyV2TabInputText;

/**
 * Tab
 */
export interface CreateViewModifyV2Tab {
  // required
  label: string;
}
