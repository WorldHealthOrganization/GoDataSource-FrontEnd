import { Moment } from '../../../../core/helperClasses/x-moment';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IExtendedColDef } from './extended-column.model';

/**
 * Filter Type
 */
export enum V2FilterType {
  TEXT,
  MULTIPLE_SELECT,
  DATE_RANGE,
  AGE_RANGE,

  // #TODO
  NUMBER_RANGE,
  DATETIME_RANGE
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

  // never
  options?: never;
  search?: (column: IExtendedColDef) => void;
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
  // #TODO
  value?: any;
  min?: Moment;
  max?: Moment;
}

/**
 * Age range
 */
export interface V2FilterAge extends V2FilterBasic {
  // required
  type: V2FilterType.AGE_RANGE

  // optional
  // #TODO
  value?: any;
  // min?: Moment;
  // max?: Moment;
}



// #TODO
/**
 * Number range
 */
export interface V2FilterNumber extends V2FilterBasic {
  // required
  type: V2FilterType.NUMBER_RANGE
  min: number;
  max: number;

  // optional
  value?: number;
}

/**
 * Datetime range
 */
export interface V2FilterDateTime extends V2FilterBasic {
  // required
  type: V2FilterType.DATETIME_RANGE

  // optional
  value?: Moment;
  min?: Moment;
  max?: Moment;
}

/**
 * Filter
 */
export type V2Filter = V2FilterText | V2FilterMultipleSelect | V2FilterDate | V2FilterAge | V2FilterNumber | V2FilterDateTime;
