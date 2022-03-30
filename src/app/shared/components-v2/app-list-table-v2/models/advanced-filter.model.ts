import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { QuestionModel } from '../../../../core/models/question.model';
import { Constants } from '../../../../core/models/constants';

/**
 * Advanced filter type
 */
export enum V2AdvancedFilterType {
  TEXT = 'text',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RANGE_NUMBER = 'range_number',
  RANGE_AGE = 'range_age',
  RANGE_DATE = 'range_date',
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
 * Question which answer
 */
export enum V2AdvancedFilterQuestionWhichAnswer {
  ANY_ANSWER = 'any',
  LAST_ANSWER = 'last'
}

// question answer mapping
export const V2AdvancedFilterQuestionComparators: {
  [key: string]: V2AdvancedFilterType
} = {
  [Constants.ANSWER_TYPES.FREE_TEXT.value]: V2AdvancedFilterType.TEXT,
  [Constants.ANSWER_TYPES.DATE_TIME.value]: V2AdvancedFilterType.RANGE_DATE,
  [Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value]: V2AdvancedFilterType.MULTISELECT,
  [Constants.ANSWER_TYPES.SINGLE_SELECTION.value]: V2AdvancedFilterType.MULTISELECT,
  [Constants.ANSWER_TYPES.NUMERIC.value]: V2AdvancedFilterType.RANGE_NUMBER,
  [Constants.ANSWER_TYPES.FILE_UPLOAD.value]: V2AdvancedFilterType.FILE
};

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
  relationshipPath?: string[];
  relationshipLabel?: string;

  // never
  optionsLoad?: never;
  options?: never;
}

/**
 * Advanced filter - Text
 */
interface IV2AdvancedFilterText extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.TEXT;
}

/**
 * Advanced filter - Single select
 */
interface IV2AdvancedFilterSingleSelect extends Omit<IV2AdvancedFilterBase, 'options'> {
  // required
  type: V2AdvancedFilterType.SELECT;
  options: ILabelValuePairModel[];
}
interface IV2AdvancedFilterSingleSelectLoader extends Omit<IV2AdvancedFilterSingleSelect, 'options' | 'optionsLoad'> {
  // required
  optionsLoad: (finished: (data: IResolverV2ResponseModel<any>) => void) => void

  // never
  options?: never;
}

/**
 * Advanced filter - Multiple select
 */
interface IV2AdvancedFilterMultipleSelect extends Omit<IV2AdvancedFilterBase, 'options'> {
  // required
  type: V2AdvancedFilterType.MULTISELECT;
  options: ILabelValuePairModel[];
}
interface IV2AdvancedFilterMultipleSelectLoader extends Omit<IV2AdvancedFilterMultipleSelect, 'options' | 'optionsLoad'> {
  // required
  optionsLoad: (finished: (data: IResolverV2ResponseModel<any>) => void) => void

  // never
  options?: never;
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

/**
 * Advanced filter - Number Range
 */
interface IV2AdvancedFilterNumberRange extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.RANGE_NUMBER;
}

/**
 * Advanced filter - Questionnaire Answers
 */
export interface IV2AdvancedFilterQuestionnaireAnswers extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS;
  template: () => QuestionModel[];

  // optional
  templateOptions?: ILabelValuePairModel[];
  templateOptionsMap?: {
    [value: string]: ILabelValuePairModel
  };
}

// advanced filter
export type V2AdvancedFilter = IV2AdvancedFilterText | IV2AdvancedFilterSingleSelect | IV2AdvancedFilterSingleSelectLoader
| IV2AdvancedFilterMultipleSelect | IV2AdvancedFilterMultipleSelectLoader | IV2AdvancedFilterAgeRange | IV2AdvancedFilterAddress
| IV2AdvancedFilterAddressPhoneNumber | IV2AdvancedFilterDateRange | IV2AdvancedFilterNumberRange | IV2AdvancedFilterQuestionnaireAnswers;
