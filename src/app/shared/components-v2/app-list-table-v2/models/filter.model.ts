import { Moment } from '../../../../core/helperClasses/x-moment';
import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IExtendedColDef } from './extended-column.model';

/**
 * Filter Type
 */
export enum V2FilterType {
  TEXT,
  MULTIPLE_SELECT,

  // #TODO
  NUMBER,
  DATE,
  DATETIME
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



// #TODO
/**
 * Number
 */
export interface V2FilterNumber extends V2FilterBasic {
  // required
  type: V2FilterType.NUMBER
  min: number;
  max: number;

  // optional
  value?: number;
}

/**
 * Date
 */
export interface V2FilterDate extends V2FilterBasic {
  // required
  type: V2FilterType.DATE
  min: Moment;
  max: Moment;

  // optional
  value?: Moment;
}

/**
 * Datetime
 */
export interface V2FilterDateTime extends V2FilterBasic {
  // required
  type: V2FilterType.DATETIME
  min: Moment;
  max: Moment;

  // optional
  value?: Moment;
}

/**
 * Filter
 */
export type V2Filter = V2FilterText | V2FilterMultipleSelect | V2FilterNumber | V2FilterDate | V2FilterDateTime;
