import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IExtendedColDef } from './extended-column.model';
import { IV2DateRange } from '../../../forms-v2/components/app-form-date-range-v2/models/date.model';
import { IV2NumberRange } from '../../../forms-v2/components/app-form-number-range-v2/models/number.model';
import { AddressModel } from '../../../../core/models/address.model';

/**
 * Filter Type
 */
export enum V2FilterType {
  TEXT,
  MULTIPLE_SELECT,
  DATE_RANGE,
  AGE_RANGE,
  ADDRESS_PHONE_NUMBER,
  ADDRESS_MULTIPLE_LOCATION,
  ADDRESS_FIELD,
  ADDRESS_ACCURATE_GEO_LOCATION,
  BOOLEAN,
  NUMBER_RANGE,
  DELETED
}

/**
 * Text type
 */
export enum V2FilterTextType {
  STARTS_WITH
}

/**
 * Base
 */
interface IV2FilterBasic {
  // required
  type: V2FilterType;

  // optional
  search?: (column: IExtendedColDef) => void;

  // never
  options?: never;
  min?: never;
  max?: never;
  address?: never;
  value?: never;
  defaultValue?: never;
  addressField?: never;
  includeNoValue?: never;
}

/**
 * Text
 */
interface IV2FilterText extends Omit<IV2FilterBasic, 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.TEXT;
  textType: V2FilterTextType;

  // optional
  value?: string;
  defaultValue?: string;
}

/**
 * Multiple select
 */
export interface IV2FilterMultipleSelect extends Omit<IV2FilterBasic, 'options' | 'value' | 'defaultValue' | 'includeNoValue'> {
  // required
  type: V2FilterType.MULTIPLE_SELECT;
  options: ILabelValuePairModel[];

  // optional
  value?: string[];
  defaultValue?: string[];
  includeNoValue?: boolean;
}

/**
 * Date range
 */
export interface IV2FilterDate extends Omit<IV2FilterBasic, 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.DATE_RANGE;

  // optional
  value?: IV2DateRange;
  defaultValue?: IV2DateRange;
}

/**
 * Age range
 */
interface IV2FilterAge extends Omit<IV2FilterBasic, 'min' | 'max' | 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.AGE_RANGE;

  // optional
  value?: IV2NumberRange;
  defaultValue?: IV2NumberRange;
  min?: number;
  max?: number;
}

/**
 * Address phone number
 */
interface IV2FilterAddressPhoneNumber extends Omit<IV2FilterBasic, 'address' | 'defaultValue'> {
  // required
  type: V2FilterType.ADDRESS_PHONE_NUMBER;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;

  // optional
  defaultValue?: string;
}

/**
 * Address location
 */
interface IV2FilterAddressMultipleLocation extends Omit<IV2FilterBasic, 'address' | 'defaultValue'> {
  // required
  type: V2FilterType.ADDRESS_MULTIPLE_LOCATION;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;

  // optional
  defaultValue?: string[];
}

/**
 * Simple address field
 */
interface IV2FilterAddressField extends Omit<IV2FilterBasic, 'address' | 'addressField' | 'defaultValue'> {
  // required
  type: V2FilterType.ADDRESS_FIELD;
  address: AddressModel;
  addressField: string;
  field: string;
  fieldIsArray: boolean;

  // optional
  defaultValue?: any;
  useLike?: boolean;
}

/**
 * Simple address field
 */
interface IV2FilterAddressAccurateGeoLocation extends Omit<IV2FilterBasic, 'address' | 'options' | 'defaultValue'> {
  // required
  type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;
  options: ILabelValuePairModel[];

  // optional
  defaultValue?: boolean | '';
}

/**
 * Boolean
 */
export interface IV2FilterBoolean extends Omit<IV2FilterBasic, 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.BOOLEAN;

  // optional
  value?: boolean | '';
  defaultValue?: boolean | '';
}

/**
 * Number range
 */
interface IV2FilterNumber extends Omit<IV2FilterBasic, 'min' | 'max' | 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.NUMBER_RANGE;

  // optional
  value?: IV2NumberRange;
  defaultValue?: IV2NumberRange;
  min?: number;
  max?: number;
}

/**
 * Deleted
 */
export interface IV2FilterDeleted extends Omit<IV2FilterBasic, 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.DELETED;

  // optional
  value?: boolean | '';
  defaultValue?: boolean | '';
}

/**
 * Filter
 */
export type V2Filter = IV2FilterText | IV2FilterMultipleSelect | IV2FilterDate | IV2FilterAge | IV2FilterAddressPhoneNumber
| IV2FilterAddressMultipleLocation | IV2FilterAddressField | IV2FilterAddressAccurateGeoLocation | IV2FilterBoolean | IV2FilterNumber
| IV2FilterDeleted;
