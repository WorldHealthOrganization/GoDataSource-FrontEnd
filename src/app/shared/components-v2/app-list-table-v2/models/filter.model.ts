import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IExtendedColDef } from './extended-column.model';
import { IV2DateRange } from '../../../forms-v2/components/app-form-date-range-v2/models/date.model';
import { IV2NumberRange } from '../../../forms-v2/components/app-form-number-range-v2/models/number.model';
import { AddressModel } from '../../../../core/models/address.model';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../forms-v2/components/app-form-select-groups-v2/models/select-group.model';

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
  DELETED,
  PHONE_NUMBER,
  SELECT_GROUPS
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
  childQueryBuilderKey?: string;

  // never
  options?: never;
  min?: never;
  max?: never;
  address?: never;
  value?: never;
  defaultValue?: never;
  addressField?: never;
  includeNoValue?: never;
  groups?: never;
  groupLabelKey?: never;
  groupValueKey?: never;
  groupOptionsKey?: never;
  groupOptionLabelKey?: never;
  groupOptionValueKey?: never;
  groupNoneLabel?: never;
  groupPartialLabel?: never;
  groupAllLabel?: never;
  groupTooltipKey?: never;
  groupOptionTooltipKey?: never;
  groupNoneTooltip?: never;
  groupPartialTooltip?: never;
  groupAllTooltip?: never;
  groupOptionHiddenKey?: never;
  groupOptionFormatMethod?: never;
  defaultValues?: never;
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
  useLike?: boolean;
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
 * Phone number
 */
export interface IV2FilterPhoneNumber extends Omit<IV2FilterBasic, 'value' | 'defaultValue'> {
  // required
  type: V2FilterType.PHONE_NUMBER;

  // optional
  value?: string;
  defaultValue?: string;
}

/**
 * Select groups
 */
export interface IV2FilterSelectGroups
  extends Omit<IV2FilterBasic,
  'value' |
  'defaultValue' |
  'groups' |
  'groupLabelKey' |
  'groupValueKey' |
  'groupOptionsKey' |
  'groupOptionLabelKey' |
  'groupOptionValueKey' |
  'groupNoneLabel' |
  'groupPartialLabel' |
  'groupAllLabel' |
  'groupTooltipKey' |
  'groupOptionTooltipKey' |
  'groupNoneTooltip' |
  'groupPartialTooltip' |
  'groupAllTooltip' |
  'groupOptionHiddenKey' |
  'groupOptionFormatMethod' |
  'defaultValues' > {
  // required
  type: V2FilterType.SELECT_GROUPS;
  groups: any[];
  groupLabelKey: string;
  groupValueKey: string;
  groupOptionsKey: string;
  groupOptionLabelKey: string;
  groupOptionValueKey: string;
  groupNoneLabel: string;
  groupPartialLabel: string;
  groupAllLabel: string;
  groupTooltipKey: string;
  groupOptionTooltipKey: string;
  groupNoneTooltip: string;
  groupPartialTooltip: string;
  groupAllTooltip: string;
  groupOptionHiddenKey: string;
  defaultValues: any[];

  // optional
  value?: string[];
  defaultValue?: string[];
  groupOptionFormatMethod?: (
    sanitized: DomSanitizer,
    i18nService: TranslateService,
    groupsMap: ISelectGroupMap<any>,
    optionsMap: ISelectGroupOptionMap<any>,
    option: any
  ) => ISelectGroupOptionFormatResponse;
}

/**
 * Filter
 */
export type V2Filter = IV2FilterText | IV2FilterMultipleSelect | IV2FilterDate | IV2FilterAge | IV2FilterAddressPhoneNumber
| IV2FilterAddressMultipleLocation | IV2FilterAddressField | IV2FilterAddressAccurateGeoLocation | IV2FilterBoolean | IV2FilterNumber
| IV2FilterDeleted | IV2FilterPhoneNumber | IV2FilterSelectGroups;
