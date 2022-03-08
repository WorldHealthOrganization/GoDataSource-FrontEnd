import { Subscriber } from 'rxjs';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';

/**
 * Side dialog config
 */
export enum V2SideDialogConfigAction {
  OPEN,
  CLOSE
}

/**
 * Side dialog input type
 */
export enum V2SideDialogConfigInputType {
  CHECKBOX,
  TEXT,
  DROPDOWN_SINGLE,
  DROPDOWN_MULTI
}

/**
 * Side dialog input
 */
interface IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType;
  name: string;

  // optional
  data?: any;
}

/**
 * Side dialog input - checkbox
 */
export interface IV2SideDialogConfigInputCheckbox extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.CHECKBOX;
  placeholder: string;
  checked: boolean;
}

/**
 * Side dialog input - text
 */
export interface IV2SideDialogConfigInputText extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TEXT;
  placeholder: string;
  value: string;
}

/**
 * Side dialog input - dropdown single
 */
export interface IV2SideDialogConfigInputSingleDropdown extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.DROPDOWN_SINGLE;
  placeholder: string;
  options: ILabelValuePairModel[];
  value: string;
}

/**
 * Side dialog input - dropdown multiple
 */
export interface IV2SideDialogConfigInputMultiDropdown extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.DROPDOWN_MULTI;
  placeholder: string;
  options: ILabelValuePairModel[];
  values: string[];
}

/**
 * Side dialog inputs
 */
export type V2SideDialogConfigInput = IV2SideDialogConfigInputCheckbox | IV2SideDialogConfigInputText | IV2SideDialogConfigInputSingleDropdown | IV2SideDialogConfigInputMultiDropdown;

/**
 * Side dialog button type
 */
export enum IV2SideDialogConfigButtonType {
  CANCEL,
  OTHER
}

/**
 * Side dialog button
 */
export interface IV2SideDialogConfigButton {
  // required
  type: IV2SideDialogConfigButtonType;
  label: string;

  // optional
  color?: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  key?: string;
}

/**
 * Side dialog config
 */
export interface IV2SideDialogConfig {
  // required
  title: string;
  inputs: V2SideDialogConfigInput[];
  bottomButtons: IV2SideDialogConfigButton[];

  // optional
  dontCloseOnBackdrop?: boolean;
  hideInputFilter?: boolean;
}

/**
 * Side dialog
 */
export interface IV2SideDialog {
  // required
  action: V2SideDialogConfigAction;
  config: IV2SideDialogConfig;
  responseSubscriber: Subscriber<IV2SideDialogResponse>;
}

/**
 * Side dialog response
 */
export interface IV2SideDialogResponse {
  // required
  button: {
    type: IV2SideDialogConfigButtonType,
    key?: string
  };
  handler: {
    hide: () => void
  };

  // optional
  data?: V2SideDialogConfigInput[];
}
