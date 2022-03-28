/**
 * Advanced filter type
 */
export enum V2AdvancedFilterType {
  TEXT
}

/**
 * Advanced filter - Base
 */
interface IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType;
  field: string;
  label: string;
}

/**
 * Advanced filter - Text
 */
interface IV2AdvancedFilterText extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.TEXT;
}

// advanced filter
export type V2AdvancedFilter = IV2AdvancedFilterText;
