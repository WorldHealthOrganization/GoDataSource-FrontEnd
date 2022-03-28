import { Subscriber } from 'rxjs';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Params } from '@angular/router';

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
  DROPDOWN_MULTI,
  LINK,
  ACCORDION,
  ACCORDION_PANEL,
  KEY_VALUE,
  HTML,
  FILTER_LIST,
  FILTER_LIST_ITEM
}

/**
 * Side dialog input validators
 */
interface IV2SideDialogConfigInputValidator {
  // optional
  required?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => boolean;
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
  visible?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => boolean;
  disabled?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => boolean;
  cssClasses?: string;
}

/**
 * Side dialog input
 */
interface IV2SideDialogConfigInput extends IV2SideDialogConfigInputBase {
  // required
  name: string;

  // optional
  change?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInputFromInput) => void;
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
 * Side dialog input - key - value
 */
export interface IV2SideDialogConfigInputKeyValue extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.KEY_VALUE;
  name: string;
  placeholder: string;
  value: string;
}

/**
 * Side dialog input - long text
 */
export interface IV2SideDialogConfigInputHTML extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.HTML;
  name: string;
  placeholder: string;
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
  clearable?: boolean;
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
 * Side dialog input - link
 */
export interface IV2SideDialogConfigInputLink extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.LINK;
  name: string;
  placeholder: string;
  link: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigInputLink) => string[];

  // optional
  linkQueryParams?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigInputLink) => Params;
}

/**
 * Side dialog input - accordion panel
 */
export interface IV2SideDialogConfigInputAccordionPanel extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.ACCORDION_PANEL;
  name: string;
  placeholder: string;
  inputs: V2SideDialogConfigInput[];

  // optional
  iconButton?: IV2SideDialogConfigIconButton;
}

/**
 * Side dialog input - accordion
 */
export interface IV2SideDialogConfigInputAccordion extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.ACCORDION;
  name: string;
  placeholder: string;
  panels: IV2SideDialogConfigInputAccordionPanel[];
}

/**
 * Side dialog input - filter list item
 */
export interface IV2SideDialogConfigInputFilterListItem extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.FILTER_LIST_ITEM;
  filterBy: IV2SideDialogConfigInputSingleDropdown;
}

/**
 * Side dialog input - filter list
 */
export interface IV2SideDialogConfigInputFilterList extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.FILTER_LIST;
  name: string;
  items: IV2SideDialogConfigInputFilterListItem[];

  // not used
  placeholder?: never;
}

/**
 * Side dialog inputs
 */
export type V2SideDialogConfigInputFromInput = IV2SideDialogConfigInputCheckbox | IV2SideDialogConfigInputText | IV2SideDialogConfigInputSingleDropdown
| IV2SideDialogConfigInputMultiDropdown | IV2SideDialogConfigInputNumber;
export type V2SideDialogConfigInput = IV2SideDialogConfigInputDivider | IV2SideDialogConfigInputKeyValue | IV2SideDialogConfigInputHTML
| V2SideDialogConfigInputFromInput | IV2SideDialogConfigInputLink | IV2SideDialogConfigInputAccordion | IV2SideDialogConfigInputFilterList;

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
 * Side dialog icon button
 */
export interface IV2SideDialogConfigIconButton {
  // required
  icon: string;
  click: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigIconButton) => void;

  // optional
  data?: any;
  color?: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  disabled?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigIconButton) => boolean;
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
  disabled?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigButton) => boolean;
}

/**
 * Side dialog config
 */
export interface IV2SideDialogConfig {
  // required
  title: {
    // required
    get: () => string,

    // optional
    data?: () => {
      [key: string]: string
    }
  };
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
  data: IV2SideDialogData;
  hide: () => void;
  update: {
    inputs: (inputs: V2SideDialogConfigInput[]) => void
  },
  buttons: {
    click: (buttonKey: string) => void
  },
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
