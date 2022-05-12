import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { CaseCenterDateRangeModel } from '../../../../core/models/case-center-date-range.model';
import { Params } from '@angular/router';
import { IAppFormIconButtonV2 } from '../../../forms-v2/core/app-form-icon-button-v2';
import { IV2Column } from '../../app-list-table-v2/models/column.model';
import { UserSettings } from '../../../../core/models/user.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { V2AdvancedFilter } from '../../app-list-table-v2/models/advanced-filter.model';

/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  // inputs
  TEXT,
  PASSWORD,
  SELECT_SINGLE,
  SELECT_MULTIPLE,
  AGE_DATE_OF_BIRTH,
  VISUAL_ID,
  DATE,
  TOGGLE_CHECKBOX,
  LOCATION_SINGLE,
  TEXTAREA,

  // input groups
  LIST,
  DOCUMENT,
  ADDRESS,
  VACCINE,
  CENTER_DATE_RANGE,

  // layout
  TAB,
  TAB_TABLE,
  SECTION
}

/**
 * Input - base value
 */
interface ICreateViewModifyV2TabInputValue<T> {
  get: (index?: number) => T;
  set: (value: T, index?: number) => void;
}

/**
 * Input - base
 */
interface ICreateViewModifyV2TabInputBase {
  // required
  type: CreateViewModifyV2TabInputType;
  name: string;
  placeholder: () => string;

  // optional
  description?: () => string;
  disabled?: (item: CreateViewModifyV2TabInput) => boolean;
  replace?: {
    condition: (item: CreateViewModifyV2TabInput) => boolean,
    html: string
  };
  noValueLabel?: () => string;

  // never
  value: never;
}

/**
 * Input - text
 */
interface ICreateViewModifyV2TabInputText extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXT;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - password
 */
interface ICreateViewModifyV2TabInputPassword extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.PASSWORD;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean,
    minlength?: () => number,
    validateOther?: () => string,
    equalValidator?: () => {
      input: string,
      err: string
    }
  };
}

/**
 * Input - select single
 */
interface ICreateViewModifyV2TabInputSingleSelect extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_SINGLE;
  options: ILabelValuePairModel[];
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean,
    validateOther?: () => string,
    notEqualValidator?: () => {
      input: string,
      err: string
    }
  };
}

/**
 * Input - select multiple
 */
interface ICreateViewModifyV2TabInputMultipleSelect extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE;
  options: ILabelValuePairModel[];
  value: ICreateViewModifyV2TabInputValue<string[]>;

  // optional
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - toggle checkbox
 */
interface ICreateViewModifyV2TabInputToggleCheckbox extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX;
  value: ICreateViewModifyV2TabInputValue<boolean>;
}

/**
 * Input - location single
 */
interface ICreateViewModifyV2TabInputLocationSingle extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.LOCATION_SINGLE;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  useOutbreakLocations?: boolean;
}

/**
 * Input - textarea
 */
interface ICreateViewModifyV2TabInputTextArea extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXTAREA;
  value: ICreateViewModifyV2TabInputValue<string>;
}

/**
 * Input - age - date of birth
 */
interface ICreateViewModifyV2TabInputAgeOrDOB extends Omit<ICreateViewModifyV2TabInputBase, 'name' | 'placeholder' | 'description' | 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH;
  name: {
    age: string,
    dob: string
  },
  ageChecked: boolean,
  ageTypeYears: boolean,
  value: {
    age: {
      years: ICreateViewModifyV2TabInputValue<number>,
      months: ICreateViewModifyV2TabInputValue<number>
    },
    dob: ICreateViewModifyV2TabInputValue<string | Moment>
  },

  // optional
  description?: {
    age: string,
    dob: string
  }
}

/**
 * Input - visual ID
 */
interface ICreateViewModifyV2TabInputVisualID extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.VISUAL_ID;
  value: ICreateViewModifyV2TabInputValue<string>;
  validator: Observable<boolean | IGeneralAsyncValidatorResponse>;

  // optional
  suffixIconButtons?: IAppFormIconButtonV2[];
}

/**
 * Input - date
 */
interface ICreateViewModifyV2TabInputDate extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.DATE;
  value: ICreateViewModifyV2TabInputValue<string | Moment>;

  // optional
  validators?: {
    required?: () => boolean,
    dateSameOrBefore?: () => (Moment | string)[],
    dateSameOrAfter?: () => (Moment | string)[]
  }
  minDate?: Moment | string;
  maxDate?: Moment | string;
}

/**
* Input - list
*/
export interface ICreateViewModifyV2TabInputList {
  // required
  type: CreateViewModifyV2TabInputType.LIST;
  name: string;
  items: any[];
  definition: {
    input: CreateViewModifyV2TabInput,
    add: {
      label: string,
      newItem: () => any
    },
    remove: {
      label: string,
      confirmLabel: string
    }
  };
  itemsChanged: (list: ICreateViewModifyV2TabInputList) => void;
}

/**
 * Input - document
 */
interface ICreateViewModifyV2TabInputDocument {
  // required
  type: CreateViewModifyV2TabInputType.DOCUMENT;
  typeOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => DocumentModel;
  };
}

/**
 * Input - address
 */
interface ICreateViewModifyV2TabInputAddress {
  // required
  type: CreateViewModifyV2TabInputType.ADDRESS;
  typeOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => AddressModel;
  };

  // optional
  name?: string; // used for single address - event
}

/**
 * Input - vaccine
 */
interface ICreateViewModifyV2TabInputVaccine {
  // required
  type: CreateViewModifyV2TabInputType.VACCINE;
  vaccineOptions: ILabelValuePairModel[];
  vaccineStatusOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => VaccineModel;
  };
}

/**
 * Input - center date range
 */
interface ICreateViewModifyV2TabInputCenterDateRange {
  // required
  type: CreateViewModifyV2TabInputType.CENTER_DATE_RANGE;
  typeOptions: ILabelValuePairModel[];
  centerOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => CaseCenterDateRangeModel;
  };

  // optional
  startDateValidators?: {
    dateSameOrAfter?: () => (Moment | string)[]
  }
}

/**
 * Input
 */
type CreateViewModifyV2TabInput = ICreateViewModifyV2TabInputText | ICreateViewModifyV2TabInputPassword | ICreateViewModifyV2TabInputSingleSelect
| ICreateViewModifyV2TabInputMultipleSelect | ICreateViewModifyV2TabInputToggleCheckbox | ICreateViewModifyV2TabInputLocationSingle
| ICreateViewModifyV2TabInputTextArea | ICreateViewModifyV2TabInputAgeOrDOB | ICreateViewModifyV2TabInputVisualID | ICreateViewModifyV2TabInputDate
| ICreateViewModifyV2TabInputList | ICreateViewModifyV2TabInputDocument | ICreateViewModifyV2TabInputAddress | ICreateViewModifyV2TabInputVaccine
| ICreateViewModifyV2TabInputCenterDateRange;

/**
 * Tab section
 */
interface ICreateViewModifyV2Section {
  // required
  type: CreateViewModifyV2TabInputType.SECTION;
  inputs: CreateViewModifyV2TabInput[];
  label: string;

  // optional
  visible?: () => boolean;
}

/**
 * Tab
 */
export interface ICreateViewModifyV2Tab {
  // required
  type: CreateViewModifyV2TabInputType.TAB;
  label: string;
  sections: ICreateViewModifyV2Section[];

  // optional
  form?: NgForm;
}

/**
 * Tab table
 */
export interface ICreateViewModifyV2TabTable {
  // required
  type: CreateViewModifyV2TabInputType.TAB_TABLE;
  label: string;
  tableColumns: IV2Column[];
  pageSettingsKey: UserSettings;
  advancedFilterType: string;
  advancedFilters: V2AdvancedFilter[];
  refresh: (tab: ICreateViewModifyV2TabTable) => void;
  refreshCount: (
    tab: ICreateViewModifyV2TabTable,
    applyHasMoreLimit?: boolean
  ) => void;
  pageIndex: number;

  // optional
  visible?: () => boolean

  // used by ui
  updateUI?: () => void;
  records$?: Observable<any[]>;
  queryBuilder?: RequestQueryBuilder;
  applyHasMoreLimit?: boolean;
  pageCount?: IBasicCount;
  previousRefreshRequest?: any;
}

/**
 * Link
 */
interface ICreateViewModifyV2Link {
  // required
  link: () => string[];

  // optional
  queryParams?: () => Params;

  // never
  click?: never;
}

/**
 * Click
 */
interface ICreateViewModifyV2Click {
  // required
  click: () => void;

  // never
  link?: never;
  queryParams?: never;
}

/**
 * Menu type
 */
export enum CreateViewModifyV2MenuType {
  GROUP,
  OPTION,
  DIVIDER
}

/**
 * Menu group
 */
interface ICreateViewModifyV2MenuGroup {
  // menu option
  type: CreateViewModifyV2MenuType.GROUP;
  label: string;

  // optional
  visible?: () => boolean;

  // never
  action?: never;
}

/**
 * Menu option
 */
interface ICreateViewModifyV2MenuOption {
  // menu option
  type: CreateViewModifyV2MenuType.OPTION;
  label: string;
  action: ICreateViewModifyV2Link | ICreateViewModifyV2Click;

  // optional
  visible?: () => boolean;
}

/**
 * Menu divider
 */
interface ICreateViewModifyV2MenuDivider {
  // optional
  type: CreateViewModifyV2MenuType.DIVIDER;
  visible?: () => boolean;

  // never
  label?: never;
  action?: never;
}

/**
 * Menu types
 */
interface ICreateViewModifyV2Menu {
  // required
  options: (ICreateViewModifyV2MenuGroup | ICreateViewModifyV2MenuOption | ICreateViewModifyV2MenuDivider)[]
}

/**
 * Button
 */
interface ICreateViewModifyV2LinkButton {
  // required
  link: ICreateViewModifyV2Link;

  // optional
  visible?: () => boolean;
}

/**
 * Create view modify data - create or update
 */
export enum CreateViewModifyV2ActionType {
  CREATE,
  UPDATE
}

/**
 * Create view modify buttons
 */
export interface ICreateViewModifyV2Buttons {
  view: ICreateViewModifyV2LinkButton,
  modify: ICreateViewModifyV2LinkButton,
  createCancel: ICreateViewModifyV2LinkButton,
  viewCancel: ICreateViewModifyV2LinkButton,
  modifyCancel: ICreateViewModifyV2LinkButton,
  quickActions?: ICreateViewModifyV2Menu
}

/**
 * Create view modify process data
 */
export type ICreateViewModifyV2CreateOrUpdate = (
  type: CreateViewModifyV2ActionType,
  data: any,
  finished: (error: any, data: any) => void,
  loading: {
    show: () => void
    hide: () => void
  },
  forms: {
    markFormsAsPristine: () => void
  }
) => void;

/**
 * Create view modify data
 */
export interface ICreateViewModifyV2 {
  // required
  tabs: (ICreateViewModifyV2Tab | ICreateViewModifyV2TabTable)[];
  create: {
    finalStep: {
      buttonLabel: string,
      message: () => string
    }
  };
  buttons: ICreateViewModifyV2Buttons;
  createOrUpdate: ICreateViewModifyV2CreateOrUpdate;
  redirectAfterCreateUpdate: (data: any) => void;

  // optional
  modifyGetAllNotOnlyDirtyFields?: boolean;
}
