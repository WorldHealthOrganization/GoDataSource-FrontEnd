import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { IAppFormIconButtonV2 } from '../../../forms-v2/core/app-form-icon-button-v2';
import { Moment } from '../../../../core/helperClasses/localization-helper';

/**
 * Required validator
 */
export interface IQuickEditorV2InputValidatorRequired {
  // optional
  required?: () => boolean
}

/**
 * Input - base value
 */
interface IQuickEditorV2InputValue<T> {
  get: () => T;
  set: (value: T) => void;
}

/**
 * Input type
 */
export enum QuickEditorV2InputType {
  TEXT,
  DATE,
  SELECT_SINGLE,
  ASYNC_VALIDATOR_TEXT,
  TEXTAREA,
  TOGGLE_CHECKBOX
}

/**
 * Input - base
 */
interface IQuickEditorV2InputBase {
  // required
  type: QuickEditorV2InputType;
  name: string;
  placeholder: string;

  // optional
  description?: string;
  disabled?: (item: QuickEditorV2Input) => boolean;

  // never
  value: never;
}

/**
 * Input - text
 */
interface IQuickEditorV2InputText extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.TEXT;
  value: IQuickEditorV2InputValue<string>;

  // optional
  validators?: IQuickEditorV2InputValidatorRequired;
}

/**
 * Input - date
 */
interface IQuickEditorV2InputDate extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.DATE;
  value: IQuickEditorV2InputValue<string | Moment>;

  // optional
  validators?: IQuickEditorV2InputValidatorRequired | {
    dateSameOrBefore?: () => (Moment | string)[],
    dateSameOrAfter?: () => (Moment | string)[]
  }
  minDate?: Moment | string;
  maxDate?: Moment | string;
}

/**
 * Input - select single
 */
export interface IQuickEditorV2InputSingleSelect extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.SELECT_SINGLE;
  options: ILabelValuePairModel[];
  value: IQuickEditorV2InputValue<string>;

  // optional
  clearable?: boolean;
  validators?: IQuickEditorV2InputValidatorRequired;
  optionsLoad?: (finished: (options: ILabelValuePairModel[]) => void) => void;
}

/**
 * Input - async validator text
 */
interface IQuickEditorV2InputAsyncValidatorText extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.ASYNC_VALIDATOR_TEXT;
  value: IQuickEditorV2InputValue<string>;
  validators: IQuickEditorV2InputValidatorRequired | {
    // required
    async: Observable<boolean | IGeneralAsyncValidatorResponse>,
  };

  // optional
  suffixIconButtons?: IAppFormIconButtonV2[];
}

/**
 * Input - textarea
 */
interface IQuickEditorV2InputTextArea extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.TEXTAREA;
  value: IQuickEditorV2InputValue<string>;

  // optional
  validators?: IQuickEditorV2InputValidatorRequired;
}

/**
 * Input - toggle checkbox
 */
interface IQuickEditorV2InputToggleCheckbox extends Omit<IQuickEditorV2InputBase, 'value'> {
  // required
  type: QuickEditorV2InputType.TOGGLE_CHECKBOX;
  value: IQuickEditorV2InputValue<boolean>;

  // never
  validators?: never;
}

/**
 * Input
 */
export type QuickEditorV2Input = IQuickEditorV2InputText | IQuickEditorV2InputDate | IQuickEditorV2InputSingleSelect | IQuickEditorV2InputAsyncValidatorText | IQuickEditorV2InputTextArea | IQuickEditorV2InputToggleCheckbox;

/**
 * Section
 */
export interface IQuickEditorV2Section<T extends QuickEditorV2Input> {
  // required
  label: string;
  inputs: T[];
}

/**
 * Quick editor handlers
 */
export interface IQuickEditorV2Handlers<T, U extends QuickEditorV2Input> {
  // required
  record$: Observable<T>;
  definitions: (data: T) => IQuickEditorV2Section<U>[];
}
