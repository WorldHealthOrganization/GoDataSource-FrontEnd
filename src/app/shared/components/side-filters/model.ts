// filter operations
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { Moment } from 'moment';

// value types
enum ValueType {
    STRING = 'string',
    NUMBER = 'number',
    SELECT = 'select',
    RANGE_NUMBER = 'range_number',
    RANGE_DATE = 'range_date',
    DATE = 'date',
    LAT_LNG_WITHIN = 'address_within'
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
    LOCATION = 'location'
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
    DATE = 'date'
}

// Model for Available Filter
export class SortModel {
    self: SortModel;

    constructor(
        // name of the field that the sort applies to
        public fieldName: string,

        // label of the field that the sort applies to
        public fieldLabel: string
    ) {
        // set handler
        this.self = this;
    }
}

// Model for Applied Sort
export class AppliedSortModel {
    // applied sort
    public sort: SortModel;

    // direction
    public direction: RequestSortDirection = RequestSortDirection.ASC;
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
        flagIt?: boolean
    }) {
        // set handler
        this.self = this;

        // assign properties
        Object.assign(
            this.self,
            data
        );
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
            valueType: ValueType.SELECT
        }],

        // multi-select
        [FilterType.MULTISELECT]: [{
            value: FilterComparator.NONE,
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
        }]
    };

    // can't remove filter
    public readonly: boolean = false;

    // default comparators
    private defaultComparator = {
        [FilterType.TEXT]: FilterComparator.TEXT_STARTS_WITH,
        [FilterType.NUMBER]: FilterComparator.IS,
        [FilterType.RANGE_NUMBER]: FilterComparator.BETWEEN,
        [FilterType.RANGE_AGE]: FilterComparator.BETWEEN,
        [FilterType.RANGE_DATE]: FilterComparator.BETWEEN,
        [FilterType.DATE]: FilterComparator.DATE,
        [FilterType.ADDRESS]: FilterComparator.CONTAINS,
        [FilterType.LOCATION]: FilterComparator.LOCATION
    };

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
        this.comparator = this.defaultComparator[this.filter.type] ?
            this.defaultComparator[this.filter.type] : (
                AppliedFilterModel.allowedComparators[this.filter.type] &&
                AppliedFilterModel.allowedComparators[this.filter.type].length > 0 ?
                    AppliedFilterModel.allowedComparators[this.filter.type][0].value :
                    null
            );

        // reset value if necessary
        this.resetValueIfNecessary();
    }

    // selected value for the filter
    public value: any;
    public extraValues: any = {};

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
            const prevVT = _.find(AppliedFilterModel.allowedComparators[this._previousFilter.type], { value: this._previousComparator });
            const currentVT = _.find(AppliedFilterModel.allowedComparators[this.filter.type], { value: this.comparator });
            if (
                prevVT &&
                currentVT &&
                prevVT.valueType === currentVT.valueType
            ) {
                // don't reset value
                // NOTHING TO DO
            } else {
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
}
