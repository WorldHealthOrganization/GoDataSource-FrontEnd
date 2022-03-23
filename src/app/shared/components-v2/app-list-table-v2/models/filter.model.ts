import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IExtendedColDef } from './extended-column.model';
import { IV2DateRange } from '../../../forms-v2/components/app-form-date-range-v2/models/date.model';
import { IV2NumberRange } from '../../../forms-v2/components/app-form-number-range-v2/models/number.model';

/**
 * Filter Type
 */
export enum V2FilterType {
  TEXT,
  MULTIPLE_SELECT,
  DATE_RANGE,
  AGE_RANGE
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
}

/**
 * Text
 */
export interface V2FilterText extends V2FilterBasic {
  // required
  type: V2FilterType.TEXT
  textType: V2FilterTextType;

  // optional
  value?: string;
}

/**
 * Multiple select
 */
export interface V2FilterMultipleSelect extends Omit<V2FilterBasic, 'options'> {
  // required
  type: V2FilterType.MULTIPLE_SELECT
  options: ILabelValuePairModel[];

  // optional
  value?: string[];
}

/**
 * Date range
 */
export interface V2FilterDate extends V2FilterBasic {
  // required
  type: V2FilterType.DATE_RANGE

  // optional
  value?: IV2DateRange;
}

/**
 * Age range
 */
export interface V2FilterAge extends Omit<V2FilterBasic, 'min' | 'max'> {
  // required
  type: V2FilterType.AGE_RANGE

  // optional
  value?: IV2NumberRange;
  min?: number;
  max?: number;
}

/**
 * Filter
 */
export type V2Filter = V2FilterText | V2FilterMultipleSelect | V2FilterDate | V2FilterAge;
