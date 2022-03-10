import { Subscriber } from 'rxjs';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';

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
  DIVIDER,
  CHECKBOX,
  TEXT,
  NUMBER,
  DROPDOWN_SINGLE,
  DROPDOWN_MULTI
}

/**
 * Side dialog input validators
 */
interface IV2SideDialogConfigInputValidator {
  // optional
  required?: (data: IV2SideDialogData, handler: IV2SideDialogHandler) => boolean;
}

/**
 * Side dialog input
 */
interface IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType;

  // optional
  name?: string;
  data?: any;
  visible?: (data: IV2SideDialogData, handler: IV2SideDialogHandler) => boolean;
  disabled?: (data: IV2SideDialogData, handler: IV2SideDialogHandler) => boolean;
}

/**
 * Side dialog input
 */
interface IV2SideDialogConfigInput extends IV2SideDialogConfigInputBase {
  // required
  name: string;

  // optional
  change?: (data: IV2SideDialogData, handler: IV2SideDialogHandler) => void;
}

/**
 * Side dialog input - divider
 */
export interface IV2SideDialogConfigInputDivider extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.DIVIDER;

  // optional
  placeholder?: string;
}

/**
 * Side dialog input - checkbox
 */
export interface IV2SideDialogConfigInputCheckbox extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.CHECKBOX;
  placeholder: string;
  checked: boolean;

  // optional
  tooltip?: string;
}

/**
 * Side dialog input - text
 */
export interface IV2SideDialogConfigInputText extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TEXT;
  placeholder: string;
  value: string;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
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

  // optional
  validators?: IV2SideDialogConfigInputValidator;
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

  // optional
  validators?: IV2SideDialogConfigInputValidator;
}

/**
 * Side dialog input - number
 */
export interface IV2SideDialogConfigInputNumber extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.NUMBER;
  placeholder: string;
  value: number;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
}

/**
 * Side dialog inputs
 */
export type V2SideDialogConfigInput = IV2SideDialogConfigInputDivider | IV2SideDialogConfigInputCheckbox | IV2SideDialogConfigInputText |
IV2SideDialogConfigInputSingleDropdown | IV2SideDialogConfigInputMultiDropdown | IV2SideDialogConfigInputNumber;

/**
 * Side dialog inputs map
 */
export interface IV2SideDialogConfigInputMap {
  [name: string]: V2SideDialogConfigInput
}

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
  disabled?: (data: IV2SideDialogData, handler: IV2SideDialogHandler) => boolean;
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
  width?: string;
  dontCloseOnBackdrop?: boolean;
  hideInputFilter?: boolean;
  initialized?: (handler: IV2SideDialogHandler) => void;
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
 * Dialog handler
 */
export interface IV2SideDialogHandler {
  // required
  form: NgForm;
  hide: () => void;
  detectChanges: () => void;
  loading: {
    show: (
      message?: string,
      messageData?: {
        [key: string]: string
      }
    ) => void,
    hide: () => void,
    message: (
      message: string,
      messageData?: {
        [key: string]: string
      }
    ) => void
  }
}

/**
 * Dialog data
 */
export interface IV2SideDialogData {
  // required
  inputs: V2SideDialogConfigInput[];
  map: IV2SideDialogConfigInputMap;
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
  handler: IV2SideDialogHandler;

  // optional
  data?: IV2SideDialogData;
}
