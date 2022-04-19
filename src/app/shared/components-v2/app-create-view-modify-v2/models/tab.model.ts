import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';

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

  // input groups
  LIST,
  DOCUMENT,
  ADDRESS,

  // layout
  TAB,
  SECTION
}

/**
 * Input - base value
 */
interface CreateViewModifyV2TabInputValue<T> {
  get: (index?: number) => T;
  set: (value: T, index?: number) => void;
}

/**
 * Input - base
 */
interface CreateViewModifyV2TabInputBase {
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
interface CreateViewModifyV2TabInputText extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXT;
  value: CreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean
  }
}

/**
 * Input - select single
 */
interface CreateViewModifyV2TabInputSingleSelect extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_SINGLE;
  options: ILabelValuePairModel[];
  value: CreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean
  }
}

/**
 * Input - age - date of birth
 */
interface CreateViewModifyV2TabInputAgeOrDOB extends Omit<CreateViewModifyV2TabInputBase, 'name' | 'placeholder' | 'description' | 'value'> {
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
      years: CreateViewModifyV2TabInputValue<number>,
      months: CreateViewModifyV2TabInputValue<number>
    },
    dob: CreateViewModifyV2TabInputValue<string | Moment>
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
interface CreateViewModifyV2TabInputVisualID extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.VISUAL_ID;
  value: CreateViewModifyV2TabInputValue<string>;
  validator: Observable<boolean | IGeneralAsyncValidatorResponse>;
}

/**
 * Input - date
 */
interface CreateViewModifyV2TabInputDate extends Omit<CreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.DATE;
  value: CreateViewModifyV2TabInputValue<string | Moment>;

  // optional
  validators?: {
    required?: () => boolean
  }
  minDate?: Moment | string;
  maxDate?: Moment | string;
}

/**
* Input - list
*/
export interface CreateViewModifyV2TabInputList {
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
  itemsChanged: (list: CreateViewModifyV2TabInputList) => void;
}

/**
 * Input - document
 */
export interface CreateViewModifyV2TabInputDocument {
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
export interface CreateViewModifyV2TabInputAddress {
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
 * Input
 */
type CreateViewModifyV2TabInput = CreateViewModifyV2TabInputText | CreateViewModifyV2TabInputSingleSelect | CreateViewModifyV2TabInputAgeOrDOB
| CreateViewModifyV2TabInputVisualID | CreateViewModifyV2TabInputDate | CreateViewModifyV2TabInputList
| CreateViewModifyV2TabInputDocument | CreateViewModifyV2TabInputAddress;

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

  // optional
  form?: NgForm;
}
