import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { QuestionModel } from '../../../../core/models/question.model';
import { Constants } from '../../../../core/models/constants';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../forms-v2/components/app-form-select-groups-v2/models/select-group.model';

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
  LOCATION_SINGLE = 'location_single',
  LOCATION_MULTIPLE = 'location_multiple',
  ADDRESS_PHONE_NUMBER = 'address_phone_number',
  PHONE_NUMBER = 'phone_number',
  QUESTIONNAIRE_ANSWERS = 'questionnaire_answers',
  FILE = 'file',
  SELECT_GROUPS = 'select-groups'
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

  // location - single
  [V2AdvancedFilterType.LOCATION_SINGLE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
    value: V2AdvancedFilterComparatorType.LOCATION
  }],

  // location - multiple
  [V2AdvancedFilterType.LOCATION_MULTIPLE]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
    value: V2AdvancedFilterComparatorType.LOCATION
  }],

  // address phone number
  [V2AdvancedFilterType.ADDRESS_PHONE_NUMBER]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
    value: V2AdvancedFilterComparatorType.CONTAINS
  }],

  // phone number
  [V2AdvancedFilterType.PHONE_NUMBER]: [{
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
  }],

  // select groups
  [V2AdvancedFilterType.SELECT_GROUPS]: [{
    label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE',
    value: V2AdvancedFilterComparatorType.NONE
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
  flagIt?: boolean;
  allowedComparators?: ILabelValuePairModel[];
  extraConditions?: RequestQueryBuilder;
  childQueryBuilderKey?: string;
  sortable?: boolean;
  havingNotHavingApplyMongo?: boolean;

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

  // optional
  useLike?: boolean;
}

/**
 * Advanced filter - Number
 */
interface IV2AdvancedFilterNumber extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.NUMBER;
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
export interface IV2AdvancedFilterAddress extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.ADDRESS;
  isArray: boolean;
}

/**
 * Advanced filter - Address phone number
 */
export interface IV2AdvancedFilterAddressPhoneNumber extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER;
  isArray: boolean;
}

/**
 * Advanced filter - Phone number
 */
export interface IV2AdvancedFilterPhoneNumber extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.PHONE_NUMBER;
}

/**
 * Advanced filter - location single
 */
export interface IV2AdvancedFilterSingleLocation extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.LOCATION_SINGLE;
}

/**
 * Advanced filter - location multiple
 */
export interface IV2AdvancedFilterMultipleLocation extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.LOCATION_MULTIPLE;
}

/**
 * Advanced filter - Date Range
 */
interface IV2AdvancedFilterDateRange extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.RANGE_DATE;
}

/**
 * Advanced filter - Date
 */
interface IV2AdvancedFilterDate extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.DATE;
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

/**
 * Advanced filter - Select groups
 */
interface IV2AdvancedFilterGroupsSelect extends IV2AdvancedFilterBase {
  // required
  type: V2AdvancedFilterType.SELECT_GROUPS;
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

// advanced filter
export type V2AdvancedFilter = IV2AdvancedFilterText | IV2AdvancedFilterNumber | IV2AdvancedFilterSingleSelect | IV2AdvancedFilterSingleSelectLoader
| IV2AdvancedFilterMultipleSelect | IV2AdvancedFilterMultipleSelectLoader | IV2AdvancedFilterAgeRange | IV2AdvancedFilterAddress
| IV2AdvancedFilterAddressPhoneNumber | IV2AdvancedFilterPhoneNumber | IV2AdvancedFilterDateRange | IV2AdvancedFilterDate | IV2AdvancedFilterNumberRange
| IV2AdvancedFilterQuestionnaireAnswers | IV2AdvancedFilterSingleLocation | IV2AdvancedFilterMultipleLocation | IV2AdvancedFilterGroupsSelect;
