import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';

/**
 * Advanced filter type
 */
export enum V2AdvancedFilterType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RANGE_NUMBER = 'range_number',
  RANGE_AGE = 'range_age',
  RANGE_DATE = 'range_date',
  DATE = 'date',
  ADDRESS = 'address',
  LOCATION = 'location',
  ADDRESS_PHONE_NUMBER = 'address_phone_number',
  QUESTIONNAIRE_ANSWERS = 'questionnaire_answers',
  FILE = 'file'
}

/**
 * Advanced filter comparator type
 */
export enum V2AdvancedFilterComparatorType {
  NONE = 'none',
  TEXT_STARTS_WITH = 'start_with',
  IS = 'is',
  CONTAINS_TEXT = 'contains_text',
  BETWEEN = 'between',
  BEFORE = 'before',
  AFTER = 'after',
  CONTAINS = 'contains',
  LOCATION = 'location',
  WITHIN = 'within',
  DATE = 'date',
  HAS_VALUE = 'has_value',
  DOESNT_HAVE_VALUE = 'doesnt_have_value'
}

/**
 * Advanced filter comparator options
 */
export const V2AdvancedFilterComparatorOptions: {
  [property: string]: ILabelValuePairModel[]
} = {
  // text
  [V2AdvancedFilterType.TEXT]: [
    {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_STARTS_WITH',
      value: V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
    }, {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_IS',
      value: V2AdvancedFilterComparatorType.IS
    }, {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS_TEXT',
      value: V2AdvancedFilterComparatorType.CONTAINS_TEXT
    }, {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
      value: V2AdvancedFilterComparatorType.HAS_VALUE
    }, {
      label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
      value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
    }
  ],

  // number
  [V2AdvancedFilterType.NUMBER]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_IS',
    value: V2AdvancedFilterComparatorType.IS
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.BEFORE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.AFTER
  }],

  // select
  [V2AdvancedFilterType.SELECT]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE',
    value: V2AdvancedFilterComparatorType.NONE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
    value: V2AdvancedFilterComparatorType.HAS_VALUE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
    value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
  }],

  // multi-select
  [V2AdvancedFilterType.MULTISELECT]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE',
    value: V2AdvancedFilterComparatorType.NONE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
    value: V2AdvancedFilterComparatorType.HAS_VALUE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
    value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
  }],

  // range number
  [V2AdvancedFilterType.RANGE_NUMBER]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
    value: V2AdvancedFilterComparatorType.BETWEEN
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.BEFORE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.AFTER
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
    value: V2AdvancedFilterComparatorType.HAS_VALUE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
    value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
  }],

  // range age
  [V2AdvancedFilterType.RANGE_AGE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
    value: V2AdvancedFilterComparatorType.BETWEEN
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.BEFORE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
    value: V2AdvancedFilterComparatorType.AFTER
  }],

  // range date
  [V2AdvancedFilterType.RANGE_DATE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
    value: V2AdvancedFilterComparatorType.BETWEEN
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BEFORE',
    value: V2AdvancedFilterComparatorType.BEFORE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_AFTER',
    value: V2AdvancedFilterComparatorType.AFTER
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
    value: V2AdvancedFilterComparatorType.HAS_VALUE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
    value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
  }],

  // date
  [V2AdvancedFilterType.DATE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DAY_IS',
    value: V2AdvancedFilterComparatorType.DATE
  }],

  // address
  [V2AdvancedFilterType.ADDRESS]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
    value: V2AdvancedFilterComparatorType.CONTAINS
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
    value: V2AdvancedFilterComparatorType.LOCATION
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_WITHIN',
    value: V2AdvancedFilterComparatorType.WITHIN
  }],

  // location
  [V2AdvancedFilterType.LOCATION]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
    value: V2AdvancedFilterComparatorType.LOCATION
  }],

  // phone number
  [V2AdvancedFilterType.ADDRESS_PHONE_NUMBER]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
    value: V2AdvancedFilterComparatorType.CONTAINS
  }],

  // questionnaire
  [V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS]: [{
    value: V2AdvancedFilterComparatorType.NONE,
    label: undefined
  }],

  // file
  [V2AdvancedFilterType.FILE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
    value: V2AdvancedFilterComparatorType.HAS_VALUE
  }, {
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
    value: V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
  }]
};

/**
 * Advanced filter - Base
 */
interface IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType;
  field: string;
  label: string;

  // optional
  id?: string;
}

/**
 * Advanced filter - Text
 */
interface IV2AdvancedFilterText extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.TEXT;
}

/**
 * Advanced filter - Multiple select
 */
interface IV2AdvancedFilterMultipleSelect extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.MULTISELECT;
  options: ILabelValuePairModel[];
}

/**
 * Advanced filter - Age Range
 */
interface IV2AdvancedFilterAgeRange extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.RANGE_AGE;
}

/**
 * Advanced filter - Address
 */
interface IV2AdvancedFilterAddress extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.ADDRESS;
  isArray: boolean;
}

/**
 * Advanced filter - Address phone number
 */
interface IV2AdvancedFilterAddressPhoneNumber extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER;
  isArray: boolean;
}

/**
 * Advanced filter - Date Range
 */
interface IV2AdvancedFilterDateRange extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.RANGE_DATE;
}

// advanced filter
export type V2AdvancedFilter = IV2AdvancedFilterText | IV2AdvancedFilterMultipleSelect | IV2AdvancedFilterAgeRange | IV2AdvancedFilterAddress
| IV2AdvancedFilterAddressPhoneNumber | IV2AdvancedFilterDateRange;
