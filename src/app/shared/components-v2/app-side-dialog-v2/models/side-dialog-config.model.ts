import { Observable } from 'rxjs';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Params } from '@angular/router';
import { V2AdvancedFilter } from '../../app-list-table-v2/models/advanced-filter.model';
import { RequestFilterOperator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { SavedFilterData } from '../../../../core/models/saved-filters.model';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { ILocation } from '../../../forms-v2/core/app-form-location-base-v2';
import { IV2NumberRange } from '../../../forms-v2/components/app-form-number-range-v2/models/number.model';
import { IV2DateRange } from '../../../forms-v2/components/app-form-date-range-v2/models/date.model';

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
  TEXTAREA,
  TIMEPICKER,
  DATE,
  DATE_RANGE,
  NUMBER,
  NUMBER_RANGE,
  DROPDOWN_SINGLE,
  DROPDOWN_MULTI,
  LOCATION_SINGLE,
  LOCATION_MULTIPLE,
  TOGGLE,
  TOGGLE_CHECKBOX,
  LINK,
  LINK_WITH_ACTION,
  GROUP,
  BUTTON,
  ROW,
  ACCORDION,
  ACCORDION_PANEL,
  KEY_VALUE,
  HTML,
  FILTER_LIST,
  FILTER_LIST_FILTER,
  FILTER_LIST_SORT,
  SORT_LIST
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
  placeholderMultipleLines?: boolean;

  // never
  value?: never;
  disabled?: never;
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
  validators?: IV2SideDialogConfigInputValidator | {
    async?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => Observable<boolean | IGeneralAsyncValidatorResponse>,
    notNumber?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => boolean,
    notInObject?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => ({
      values: {
        [prop: string]: true
      },
      err: string
    }),
    noSpace?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => boolean,
    regex?: () => {
      expression: string,
      flags?: string,
      msg?: string
    }
  };
  tooltip?: string;
}

/**
 * Side dialog input - textarea
 */
export interface IV2SideDialogConfigInputTextarea extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TEXTAREA;
  placeholder: string;
  value: string;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
}

/**
 * Side dialog input - timepicker
 */
export interface IV2SideDialogConfigInputTimepicker extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TIMEPICKER;
  placeholder: string;
  value: string;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
  tooltip?: string;
}

/**
 * Side dialog input - date
 */
export interface IV2SideDialogConfigInputDate extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.DATE;
  placeholder: string;
  value: string | Moment;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
  tooltip?: string;
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
  tooltip?: string;
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
  tooltip?: string;
}

/**
 * Side dialog input - location single
 */
export interface IV2SideDialogConfigInputSingleLocation extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.LOCATION_SINGLE;
  placeholder: string;
  value: string;
  useOutbreakLocations: boolean;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
  clearable?: boolean;
  locationChanged?: (location: ILocation) => void;
}

/**
 * Side dialog input - location multiple
 */
export interface IV2SideDialogConfigInputMultipleLocation extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.LOCATION_MULTIPLE;
  placeholder: string;
  values: string[];
  useOutbreakLocations: boolean;

  // optional
  validators?: IV2SideDialogConfigInputValidator;
}

/**
 * Side dialog input - toggle
 */
export interface IV2SideDialogConfigInputToggle extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TOGGLE;
  options: ILabelValuePairModel[];
  value: string | boolean;

  // never
  placeholder?: never;
}

/**
 * Side dialog input - toggle checkbox
 */
export interface IV2SideDialogConfigInputToggleCheckbox extends IV2SideDialogConfigInput {
  // required
  type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX;
  placeholder: string;
  value: boolean;
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
  validators?: IV2SideDialogConfigInputValidator | {
    minMax?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: V2SideDialogConfigInput) => ({
      min: number,
      max: number
    });
  };
  tooltip?: string;
}

/**
 * Side dialog input - date range
 */
export interface IV2SideDialogConfigInputDateRange extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.DATE_RANGE;
  value: IV2DateRange;

  // optional
  validators?: IV2SideDialogConfigInputValidator;

  // never
  placeholder?: never;
}

/**
 * Side dialog input - number range
 */
export interface IV2SideDialogConfigInputNumberRange extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.NUMBER_RANGE;
  value: IV2NumberRange;

  // optional
  validators?: IV2SideDialogConfigInputValidator;

  // never
  placeholder?: never;
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
 * Side dialog input - link with action
 */
export interface IV2SideDialogConfigInputLinkWithAction extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.LINK_WITH_ACTION;
  name: string;
  placeholder: string;
  link: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigInputLinkWithAction) => string[];
  actions: IV2SideDialogConfigInputToggle;

  // optional
  linkQueryParams?: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigInputLinkWithAction) => Params;
}

/**
 * Side dialog input - group
 */
export interface IV2SideDialogConfigInputGroup extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.GROUP;
  name: string;
  inputs: V2SideDialogConfigInput[];

  // optional
  placeholder?: string;
}

/**
 * Side dialog input - button
 */
export interface IV2SideDialogConfigInputButton extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.BUTTON;
  name: string;
  placeholder: string;
  color: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  click: (data: IV2SideDialogData, handler: IV2SideDialogHandler, item: IV2SideDialogConfigInputButton) => void;
}

/**
 * Side dialog input - row
 */
export interface IV2SideDialogConfigInputRow extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.ROW;
  name: string;
  inputs: V2SideDialogConfigInput[];

  // optional
  placeholder?: string;
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
 * Side dialog input - filter list filter
 */
export interface IV2SideDialogConfigInputFilterListFilter extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.FILTER_LIST_FILTER;
  filterBy: IV2SideDialogConfigInputSingleDropdown;
  comparator: IV2SideDialogConfigInputSingleDropdown;

  // optional
  value?: any;
  extraValues?: {
    [key: string]: any
  };
}

/**
 * Side dialog input - filter list sort
 */
export interface IV2SideDialogConfigInputFilterListSort extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.FILTER_LIST_SORT;
  sortBy: IV2SideDialogConfigInputSingleDropdown;
  order: IV2SideDialogConfigInputSingleDropdown;
}

/**
 * Side dialog input - filter list
 */
export interface IV2SideDialogConfigInputFilterList extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.FILTER_LIST;
  name: string;
  options: V2AdvancedFilter[];
  filters: IV2SideDialogConfigInputFilterListFilter[];
  sorts: IV2SideDialogConfigInputFilterListSort[];
  operatorValue: RequestFilterOperator;

  // not used
  placeholder?: never;

  // optional
  optionsAsLabelValue?: ILabelValuePairModel[];
  sortableOptionsAsLabelValue?: ILabelValuePairModel[];
  optionsAsLabelValueMap?: {
    [optionId: string]: ILabelValuePairModel
  };
  operatorHide?: boolean;
  disableAdd?: boolean;
  disableReset?: boolean;
  disableDelete?: boolean;
}

/**
 * Side dialog input - filter list
 */
export interface IV2SideDialogConfigInputSortList extends IV2SideDialogConfigInputBase {
  // required
  type: V2SideDialogConfigInputType.SORT_LIST;
  name: string;
  items: ILabelValuePairModel[];

  // not used
  placeholder?: never;
}

/**
 * Side dialog inputs
 */
export type V2SideDialogConfigInputFromInput = IV2SideDialogConfigInputCheckbox | IV2SideDialogConfigInputText | IV2SideDialogConfigInputTextarea
| IV2SideDialogConfigInputTimepicker | IV2SideDialogConfigInputDate | IV2SideDialogConfigInputSingleDropdown | IV2SideDialogConfigInputMultiDropdown
| IV2SideDialogConfigInputSingleLocation | IV2SideDialogConfigInputMultipleLocation | IV2SideDialogConfigInputToggle | IV2SideDialogConfigInputToggleCheckbox
| IV2SideDialogConfigInputNumber;
export type V2SideDialogConfigInput = IV2SideDialogConfigInputDivider | IV2SideDialogConfigInputDateRange | IV2SideDialogConfigInputNumberRange
| IV2SideDialogConfigInputKeyValue | IV2SideDialogConfigInputHTML | V2SideDialogConfigInputFromInput | IV2SideDialogConfigInputLink
| IV2SideDialogConfigInputLinkWithAction | IV2SideDialogConfigInputGroup | IV2SideDialogConfigInputButton | IV2SideDialogConfigInputRow
| IV2SideDialogConfigInputAccordion | IV2SideDialogConfigInputFilterList | IV2SideDialogConfigInputSortList;

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
  responseSubscriber: (response: IV2SideDialogResponse) => void;
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
    inputs: (inputs: V2SideDialogConfigInput[]) => void,
    refresh: () => void,
    changeTitle: (
      title: string,
      data?: {
        [key: string]: string
      }
    ) => void,
    addAdvancedFilter: (input: IV2SideDialogConfigInputFilterList) => IV2SideDialogConfigInputFilterListFilter,
    resetQuestionnaireFilter: (
      filter: IV2SideDialogConfigInputFilterListFilter,
      ...specificProperties: string[]
    ) => void,
    addAdvancedSort: (input: IV2SideDialogConfigInputFilterList) => IV2SideDialogConfigInputFilterListSort,
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
  echo: {
    [prop: string]: any
  };
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

/**
 * Side dialog advanced filters response
 */
export interface IV2SideDialogAdvancedFiltersResponse {
  // required
  queryBuilder: RequestQueryBuilder;
  filtersApplied: SavedFilterData;
}
