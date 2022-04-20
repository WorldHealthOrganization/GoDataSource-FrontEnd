import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { CaseCenterDateRangeModel } from '../../../../core/models/case-center-date-range.model';

/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  // inputs
  TEXT,
  SELECT_SINGLE,
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
  placeholder: string;

  // optional
  description?: string;
  disabled?: (item: CreateViewModifyV2TabInput) => boolean;
  replace?: {
    condition: (item: CreateViewModifyV2TabInput) => boolean,
    html: string
  };

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
  }
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
    required?: () => boolean
  }
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
}

/**
 * Input
 */
type CreateViewModifyV2TabInput = ICreateViewModifyV2TabInputText | ICreateViewModifyV2TabInputSingleSelect | ICreateViewModifyV2TabInputToggleCheckbox
| ICreateViewModifyV2TabInputLocationSingle | ICreateViewModifyV2TabInputTextArea | ICreateViewModifyV2TabInputAgeOrDOB | ICreateViewModifyV2TabInputVisualID
| ICreateViewModifyV2TabInputDate | ICreateViewModifyV2TabInputList | ICreateViewModifyV2TabInputDocument | ICreateViewModifyV2TabInputAddress
| ICreateViewModifyV2TabInputVaccine | ICreateViewModifyV2TabInputCenterDateRange;

/**
 * Tab section
 */
interface ICreateViewModifyV2Section {
  // required
  type: CreateViewModifyV2TabInputType.SECTION;
  inputs: CreateViewModifyV2TabInput[];
  label: string;
}

/**
 * Tab
 */
export interface ICreateViewModifyV2Tab {
  // required
  type: CreateViewModifyV2TabInputType.TAB;
  sections: ICreateViewModifyV2Section[];
  label: string;

  // optional
  form?: NgForm;
}

/**
 * Create view modify data
 */
export interface CreateViewModifyV2 {
  // required
  tabs: ICreateViewModifyV2Tab[];
}
