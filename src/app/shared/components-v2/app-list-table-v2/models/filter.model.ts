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
  BOOLEAN
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
interface V2FilterBasic {
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
  addressField?: never;
}

/**
 * Text
 */
interface V2FilterText extends Omit<V2FilterBasic, 'value'> {
  // required
  type: V2FilterType.TEXT;
  textType: V2FilterTextType;

  // optional
  value?: string;
}

/**
 * Multiple select
 */
export interface V2FilterMultipleSelect extends Omit<V2FilterBasic, 'options' | 'value'> {
  // required
  type: V2FilterType.MULTIPLE_SELECT;
  options: ILabelValuePairModel[];

  // optional
  value?: string[];
}

/**
 * Date range
 */
export interface V2FilterDate extends Omit<V2FilterBasic, 'value'> {
  // required
  type: V2FilterType.DATE_RANGE;

  // optional
  value?: IV2DateRange;
}

/**
 * Age range
 */
interface V2FilterAge extends Omit<V2FilterBasic, 'min' | 'max' | 'value'> {
  // required
  type: V2FilterType.AGE_RANGE;

  // optional
  value?: IV2NumberRange;
  min?: number;
  max?: number;
}

/**
 * Address phone number
 */
interface V2FilterAddressPhoneNumber extends Omit<V2FilterBasic, 'address'> {
  // required
  type: V2FilterType.ADDRESS_PHONE_NUMBER;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;
}

/**
 * Address location
 */
interface V2FilterAddressMultipleLocation extends Omit<V2FilterBasic, 'address'> {
  // required
  type: V2FilterType.ADDRESS_MULTIPLE_LOCATION;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;
}

/**
 * Simple address field
 */
interface V2FilterAddressField extends Omit<V2FilterBasic, 'address' | 'addressField'> {
  // required
  type: V2FilterType.ADDRESS_FIELD;
  address: AddressModel;
  addressField: string;
  field: string;
  fieldIsArray: boolean;
}

/**
 * Simple address field
 */
interface V2FilterAddressAccurateGeoLocation extends Omit<V2FilterBasic, 'address' | 'options'> {
  // required
  type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION;
  address: AddressModel;
  field: string;
  fieldIsArray: boolean;
  options: ILabelValuePairModel[];
}

/**
 * Boolean
 */
export interface V2FilterBoolean extends Omit<V2FilterBasic, 'value'> {
  // required
  type: V2FilterType.BOOLEAN;

  // optional
  value?: boolean | string;
}

/**
 * Filter
 */
export type V2Filter = V2FilterText | V2FilterMultipleSelect | V2FilterDate | V2FilterAge | V2FilterAddressPhoneNumber
| V2FilterAddressMultipleLocation | V2FilterAddressField | V2FilterAddressAccurateGeoLocation | V2FilterBoolean;
