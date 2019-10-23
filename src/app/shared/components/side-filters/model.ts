// filter operations
import { Observable } from 'rxjs';
import { RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { Moment } from '../../../core/helperClasses/x-moment';
import { AnswerModel, QuestionModel } from '../../../core/models/question.model';
import { Constants } from '../../../core/models/constants';

// value types
enum ValueType {
    STRING = 'string',
    NUMBER = 'number',
    SELECT = 'select',
    RANGE_NUMBER = 'range_number',
    RANGE_DATE = 'range_date',
    DATE = 'date',
    LAT_LNG_WITHIN = 'address_within',
    QUESTIONNAIRE_ANSWERS = 'questionnaire_answers'
}

// filter types
export enum FilterType {
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

// comparator types
export enum FilterComparator {
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

// which answer to check
export enum QuestionWhichAnswer {
    ANY_ANSWER = 'any',
    LAST_ANSWER = 'last'
}

// Model for questionnaire question side filters
export class QuestionSideFilterModel extends QuestionModel {
    orderLabel: string;
    multiAnswerParent: boolean;
    self: QuestionSideFilterModel;

    /**
     * Constructor
     */
    constructor(data?: {
        orderLabel: string,
        multiAnswerParent: boolean
    }) {
        // no need to assign data since we assign it here
        super(data);

        // assign data
        this.orderLabel = _.get(data, 'orderLabel');
        this.multiAnswerParent = _.get(data, 'multiAnswerParent');

        // keep ref to itself for easy access from select
        this.self = this;
    }
}

// Model for Available Filter
export class SortModel {
    self: SortModel;

    /**
     * Unique key
     */
    uniqueKey: string;

    constructor(
        // name of the field that the sort applies to
        public fieldName: string,

        // label of the field that the sort applies to
        public fieldLabel: string
    ) {
        // set handler
        this.self = this;

        // generate unique key
        this.uniqueKey = this.fieldName + this.fieldLabel;
    }

    /**
     * Return unique key of sort
     */
    sanitizeForSave() {
        return {
            uniqueKey: this.uniqueKey
        };
    }
}

// Model for Applied Sort
export class AppliedSortModel {
    // applied sort
    public sort: SortModel;

    // direction
    public direction: RequestSortDirection = RequestSortDirection.ASC;

    constructor(data?: {
        sort: SortModel,
        direction: RequestSortDirection
    }) {
        if (data) {
            // assign properties
            Object.assign(
                this,
                data
            );
        }
    }

    /**
     * Return the sort criteria
     */
    sanitizeForSave() {
        return {
            sort: this.sort.sanitizeForSave(),
            direction: this.direction
        };
    }
}


// Model for Available Filter
export class FilterModel {

    self: FilterModel;

    // name of the field that the filter applies to
    fieldName: string;

    // label of the field that the filter applies to
    fieldLabel: string;

    // filter type
    type: FilterType;

    // select options for SELECT and MULTISELECT filter types
    options$: Observable<any[]> = null;
    optionsLabelKey: string = 'label';
    optionsValueKey: string = 'value';

    // sortable field / relationship field ( default false )
    sortable: boolean = false;

    // relationship path in case we want to search inside a relationship
    relationshipPath: string[] = null;
    relationshipLabel: string = null;
    extraConditions: RequestQueryBuilder = null;

    // children query builders ( either main qb or relationship qb )
    childQueryBuilderKey: string;

    // required ? - add filter from teh start, also you won't be able to remove it
    required: boolean = false;
    value: any;

    maxDate: string | Moment;

    // select multiple / single option(s)
    multipleOptions: boolean = true;

    // overwrite allowed comparators
    allowedComparators: {
        label?: string,
        value: FilterComparator,
        valueType: ValueType
    }[];

    // flag where property instead of creating specific rules...
    flagIt: boolean;

    // address field is array ?
    // - used also to search for phone number in an array of addresses or just one address ?
    addressFieldIsArray: boolean = true;

    // questionnaire template
    private _questionnaireTemplate: QuestionModel[];
    questionnaireTemplateQuestions: QuestionSideFilterModel[];
    public set questionnaireTemplate(questionnaireTemplate: QuestionModel[]) {
        // set questionnaire template
        this._questionnaireTemplate = (questionnaireTemplate || []).map((question: any) => new QuestionModel(question));

        // function that adds questions recursively
        // the list of questions should already be sorted, so we don't need to sort them before adding them to the list
        this.questionnaireTemplateQuestions = [];
        const addQuestion = (
            question: QuestionModel,
            prefixOrder: string,
            multiAnswerParent: boolean
        ) => {
            // add question to list
            const orderLabel: string = (
                prefixOrder ?
                    (prefixOrder + '.') :
                    ''
            ) + question.order;
            this.questionnaireTemplateQuestions.push(new QuestionSideFilterModel({
                ...question,
                orderLabel: orderLabel,
                multiAnswerParent: multiAnswerParent
            }));

            // add recursive sub-questions
            if (!_.isEmpty(question.answers)) {
                question.answers.forEach((answer: AnswerModel) => {
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        answer.additionalQuestions
                            // ignore some types of questions
                            .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
                            .forEach((childQuestion: QuestionModel, index: number) => {
                                childQuestion.order = index + 1;
                                addQuestion(
                                    childQuestion,
                                    orderLabel,
                                    multiAnswerParent
                                );
                            });
                    }
                });
            }
        };

        // determine list of questions to display
        (this.questionnaireTemplate || [])
            // ignore some types of questions
            .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
            .forEach((question: QuestionModel, index: number) => {
                question.order = index + 1;
                addQuestion(
                    question,
                    '',
                    question.multiAnswer
                );
            });
    }
    public get questionnaireTemplate(): QuestionModel[] {
        return this._questionnaireTemplate;
    }

    /**
     * Unique key
     */
    uniqueKey: string;

    /**
     * Constructor
     * @param data ( fieldName / fieldLabel / type are required )
     */
    constructor(data: {
        fieldName: string,
        fieldLabel: string,
        type: FilterType,
        options$?: Observable<any[]>,
        optionsLabelKey?: string,
        optionsValueKey?: string,
        sortable?: boolean,
        relationshipPath?: string[],
        relationshipLabel?: string,
        extraConditions?: RequestQueryBuilder,
        childQueryBuilderKey?: string,
        required?: boolean,
        value?: any,
        multipleOptions?: boolean,
        maxDate?: string | Moment,
        allowedComparators?: {
            label?: string,
            value: FilterComparator,
            valueType: ValueType
        }[],
        flagIt?: boolean,
        questionnaireTemplate?: QuestionModel[],
        addressFieldIsArray?: boolean
    }) {
        // set handler
        this.self = this;

        // assign properties
        Object.assign(
            this.self,
            data
        );

        // generate unique key
        this.uniqueKey = this.fieldName + this.fieldLabel;
    }

    /**
     * Return unique key of filter
     */
    sanitizeForSave() {
        return {
            uniqueKey: this.uniqueKey
        };
    }
}

// Model for Applied Filter
export class AppliedFilterModel {
    // allowed comparators accordingly with filter type
    public static allowedComparators: {
        [key: string]: {
            label?: string,
            value: FilterComparator,
            valueType: ValueType
        }[]
    } = {
        // text
        [FilterType.TEXT]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_STARTS_WITH',
            value: FilterComparator.TEXT_STARTS_WITH,
            valueType: ValueType.STRING
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_IS',
            value: FilterComparator.IS,
            valueType: ValueType.STRING
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS_TEXT',
            value: FilterComparator.CONTAINS_TEXT,
            valueType: ValueType.STRING
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }],

        // number
        [FilterType.NUMBER]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_IS',
            value: FilterComparator.IS,
            valueType: ValueType.NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
            value: FilterComparator.BEFORE,
            valueType: ValueType.NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
            value: FilterComparator.AFTER,
            valueType: ValueType.NUMBER
        }],

        // select
        [FilterType.SELECT]: [{
            value: FilterComparator.NONE,
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE',
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }],

        // multi-select
        [FilterType.MULTISELECT]: [{
            value: FilterComparator.NONE,
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE',
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }],

        // range number
        [FilterType.RANGE_NUMBER]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
            value: FilterComparator.BETWEEN,
            valueType: ValueType.RANGE_NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
            value: FilterComparator.BEFORE,
            valueType: ValueType.RANGE_NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
            value: FilterComparator.AFTER,
            valueType: ValueType.RANGE_NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }],

        // range age
        [FilterType.RANGE_AGE]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
            value: FilterComparator.BETWEEN,
            valueType: ValueType.RANGE_NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
            value: FilterComparator.BEFORE,
            valueType: ValueType.RANGE_NUMBER
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
            value: FilterComparator.AFTER,
            valueType: ValueType.RANGE_NUMBER
        }],

        // range date
        [FilterType.RANGE_DATE]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
            value: FilterComparator.BETWEEN,
            valueType: ValueType.RANGE_DATE
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BEFORE',
            value: FilterComparator.BEFORE,
            valueType: ValueType.RANGE_DATE
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_AFTER',
            value: FilterComparator.AFTER,
            valueType: ValueType.RANGE_DATE
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }],

        // date
        [FilterType.DATE]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DAY_IS',
            value: FilterComparator.DATE,
            valueType: ValueType.DATE
        }],

        // address
        [FilterType.ADDRESS]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
            value: FilterComparator.CONTAINS,
            valueType: ValueType.STRING
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
            value: FilterComparator.LOCATION,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_WITHIN',
            value: FilterComparator.WITHIN,
            valueType: ValueType.LAT_LNG_WITHIN
        }],

        // location
        [FilterType.LOCATION]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LOCATION',
            value: FilterComparator.LOCATION,
            valueType: ValueType.SELECT
        }],

        // phone number
        [FilterType.ADDRESS_PHONE_NUMBER]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
            value: FilterComparator.CONTAINS,
            valueType: ValueType.STRING
        }],

        // questionnaire
        [FilterType.QUESTIONNAIRE_ANSWERS]: [{
            value: FilterComparator.NONE,
            valueType: ValueType.QUESTIONNAIRE_ANSWERS
        }],

        // file
        [FilterType.FILE]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE',
            value: FilterComparator.HAS_VALUE,
            valueType: ValueType.SELECT
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE',
            value: FilterComparator.DOESNT_HAVE_VALUE,
            valueType: ValueType.SELECT
        }]
    };

    // question answer mapping
    public static allowedQuestionComparators: {
        [key: string]: FilterType
    } = {
        [Constants.ANSWER_TYPES.FREE_TEXT.value]: FilterType.TEXT,
        [Constants.ANSWER_TYPES.DATE_TIME.value]: FilterType.RANGE_DATE,
        [Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value]: FilterType.MULTISELECT,
        [Constants.ANSWER_TYPES.SINGLE_SELECTION.value]: FilterType.MULTISELECT,
        [Constants.ANSWER_TYPES.NUMERIC.value]: FilterType.RANGE_NUMBER,
        [Constants.ANSWER_TYPES.FILE_UPLOAD.value]: FilterType.FILE
    };

    // default comparators
    public static defaultComparator = {
        [FilterType.TEXT]: FilterComparator.TEXT_STARTS_WITH,
        [FilterType.SELECT]: FilterComparator.NONE,
        [FilterType.MULTISELECT]: FilterComparator.NONE,
        [FilterType.NUMBER]: FilterComparator.IS,
        [FilterType.RANGE_NUMBER]: FilterComparator.BETWEEN,
        [FilterType.RANGE_AGE]: FilterComparator.BETWEEN,
        [FilterType.RANGE_DATE]: FilterComparator.BETWEEN,
        [FilterType.DATE]: FilterComparator.DATE,
        [FilterType.ADDRESS]: FilterComparator.CONTAINS,
        [FilterType.LOCATION]: FilterComparator.LOCATION,
        [FilterType.ADDRESS_PHONE_NUMBER]: FilterComparator.CONTAINS
    };

    // can't remove filter
    public readonly: boolean = false;

    // applied filter
    private _previousFilter: FilterModel;
    private _filter: FilterModel;
    public get filter(): FilterModel {
        return this._filter;
    }
    public set filter(value: FilterModel) {
        // set filter
        this._filter = value;

        // determine the default comparator
        this.comparator = AppliedFilterModel.defaultComparator[this.filter.type] ?
            AppliedFilterModel.defaultComparator[this.filter.type] : (
                AppliedFilterModel.allowedComparators[this.filter.type] &&
                AppliedFilterModel.allowedComparators[this.filter.type].length > 0 ?
                    AppliedFilterModel.allowedComparators[this.filter.type][0].value :
                    null
            );

        // reset value if necessary
        this.resetValueIfNecessary();
    }

    // question answers
    selectedQuestion: QuestionSideFilterModel;

    // selected value for the filter
    public extraValues: any = {};
    private _value: any;
    public set value(value: any) {
        // set value
        this._value = value;

        // determine selected question
        if (
            this.value &&
            this.filter &&
            this.filter.questionnaireTemplateQuestions &&
            this.filter.type === FilterType.QUESTIONNAIRE_ANSWERS
        ) {
            this.selectedQuestion = _.find(this.filter.questionnaireTemplateQuestions, { variable: this.value }) as QuestionSideFilterModel;
        } else {
            this.selectedQuestion = null;
        }
    }
    public get value(): any {
        return this._value;
    }

    // selected comparator
    private _previousComparator: FilterComparator;
    private _comparator: FilterComparator;
    public set comparator(value: FilterComparator) {
        // set comparator
        this._comparator = value;

        // reset value if necessary
        this.resetValueIfNecessary();
    }
    public get comparator(): FilterComparator {
        return this._comparator;
    }

    /**
     * Constructor
     * @param data
     */
    constructor(data?: {
        readonly?: boolean,
        filter?: FilterModel,
        value?: any,
        extraValues?: any,
        comparator?: FilterComparator
    }) {
        // assign properties
        Object.assign(
            this,
            data ? data : {}
        );
    }

    /**
     * Reset value if necessary
     */
    private resetValueIfNecessary() {
        // no previous filter ?
        if (!this._previousFilter) { this._previousFilter = _.cloneDeep(this.filter); }
        if (!this._previousComparator) { this._previousComparator = _.cloneDeep(this.comparator); }

        // reset value only if necessary
        if (
            this.filter &&
            this.comparator
        ) {
            // exclude questionnaire answers since we have fields that we need to reset inside ( like comparators and other that may be different from question to question )
            const prevVT = _.find(AppliedFilterModel.allowedComparators[this._previousFilter.type], { value: this._previousComparator });
            const currentVT = _.find(AppliedFilterModel.allowedComparators[this.filter.type], { value: this.comparator });
            if (
                prevVT &&
                currentVT &&
                prevVT.valueType === currentVT.valueType &&
                prevVT.valueType !== ValueType.QUESTIONNAIRE_ANSWERS
            ) {
                // don't reset value
                // NOTHING TO DO
            } else {
                // reset values
                this.value = null;
                this.extraValues = {};
            }
        } else {
            this.value = null;
            this.extraValues = {};
        }

        // set previous values
        this._previousFilter = _.cloneDeep(this.filter);
        this._previousComparator = _.cloneDeep(this.comparator);
    }

    /**
     * Check to see if we have at least 2 comparators, to know if we need to display the comparators dropdown
     */
    public get hasMoreThanOneComparator(): boolean {
        return this.filter.allowedComparators ?
            this.filter.allowedComparators.length > 1 : (
                AppliedFilterModel.allowedComparators[this.filter.type] &&
                AppliedFilterModel.allowedComparators[this.filter.type].length > 1
            );
    }

    /**
     * Return the filter
     */
    sanitizeForSave() {
        return {
            filter: this.filter.sanitizeForSave(),
            comparator: this.comparator,
            value: this.value,
            extraValues: this.extraValues
        };
    }
}
