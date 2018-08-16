// filter operations
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';

// filter types
export enum FilterType {
    TEXT = 'text',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    RANGE_NUMBER = 'range_number',
    RANGE_DATE = 'range_date',
    ADDRESS = 'address'
}

// comparator types
export enum FilterComparator {
    TEXT_STARTS_WITH = 'start_with',
    IS = 'is',
    BETWEEN = 'between',
    BEFORE = 'before',
    AFTER = 'after',
    CONTAINS = 'contains',
    WITHIN = 'within'
}

// Model for Available Filter
export class FilterModel {

    self: FilterModel;

    constructor(
        // name of the field that the filter applies to
        public fieldName: string,
        // label of the field that the filter applies to
        public fieldLabel: string,
        // filter type
        public type: FilterType,
        // select options for SELECT and MULTISELECT filter types
        public options$: Observable<any[]> = null,
        // relationship path in case we want to search inside a relationship
        public relationshipPath: string[] = null,
        public relationshipLabel: string = null,
        public extraConditions: RequestQueryBuilder = null
    ) {
        this.self = this;
    }
}

// Model for Applied Filter
export class AppliedFilterModel {
    // allowed comparators accordingly with filter type
    public allowedComparators = {
        // text
        [FilterType.TEXT]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_STARTS_WITH',
            value: FilterComparator.TEXT_STARTS_WITH
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_IS',
            value: FilterComparator.IS
        }],

        // select
        [FilterType.SELECT]: [],

        // multi-select
        [FilterType.MULTISELECT]: [],

        // range number
        [FilterType.RANGE_NUMBER]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
            value: FilterComparator.BETWEEN
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_LESS_OR_EQUAL',
            value: FilterComparator.BEFORE
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_GREATER_OR_EQUAL',
            value: FilterComparator.AFTER
        }],

        // range date
        [FilterType.RANGE_DATE]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BETWEEN',
            value: FilterComparator.BETWEEN
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_BEFORE',
            value: FilterComparator.BEFORE
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_AFTER',
            value: FilterComparator.AFTER
        }],

        // address
        [FilterType.ADDRESS]: [{
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_CONTAINS',
            value: FilterComparator.CONTAINS
        }, {
            label: 'LNG_SIDE_FILTERS_COMPARATOR_LABEL_WITHIN',
            value: FilterComparator.WITHIN
        }]
    };

    // default comparators
    private defaultComparator = {
        [FilterType.TEXT]: FilterComparator.TEXT_STARTS_WITH,
        [FilterType.RANGE_DATE]: FilterComparator.BETWEEN,
        [FilterType.ADDRESS]: FilterComparator.CONTAINS
    };

    // applied filter
    private _filter: FilterModel;
    public get filter(): FilterModel {
        return this._filter;
    }
    public set filter(value: FilterModel) {
        // set filter
        this._filter = value;

        // reset value
        this.value = null;

        // determine the default comparator
        this.comparator = this.defaultComparator[this.filter.type] ?
            this.defaultComparator[this.filter.type] : (
                this.allowedComparators[this.filter.type] &&
                this.allowedComparators[this.filter.type].length > 0 ?
                    this.allowedComparators[this.filter.type][0].value :
                    null
            );
    }

    // selected value for the filter
    public value: any;

    // selected comparator
    private _comparator: FilterComparator;
    public set comparator(value: FilterComparator) {
        // set comparator
        this._comparator = value;

        // reset value
        this.value = null;
    }
    public get comparator(): FilterComparator {
        return this._comparator;
    }

    /**
     * Check to see if we have at least 2 comparators, to know if we need to display the comparators dropdown
     */
    public get hasMoreThanOneComparator(): boolean {
        return this.allowedComparators[this.filter.type] &&
            this.allowedComparators[this.filter.type].length > 1;
    }
}
