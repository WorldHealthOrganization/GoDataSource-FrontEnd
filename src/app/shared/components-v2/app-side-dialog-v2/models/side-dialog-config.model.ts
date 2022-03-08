/**
 * Side dialog config
 */
import { Subscriber } from 'rxjs';

export enum V2SideDialogConfigAction {
  OPEN,
  CLOSE
}

/**
 * Side dialog input type
 */
export enum V2SideDialogConfigInputType {
  CHECKBOX
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
interface IV2SideDialogConfigInputCheckbox extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.CHECKBOX;
  checked: boolean;
  placeholder: string;
}

/**
 * Side dialog inputs
 */
export type V2SideDialogConfigInput = IV2SideDialogConfigInputCheckbox;

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

  // optional
  data?: V2SideDialogConfigInput[];
}
