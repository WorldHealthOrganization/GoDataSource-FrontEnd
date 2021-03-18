import * as _ from 'lodash';

/**
 * Saved side filter sort
 */
export class SavedFilterDataAppliedFilter {
    // data
    filter: {
        uniqueKey: string
    };
    comparator: string;
    value: any;
    extraValues: any;

    /**
     * Constructor
     */
    constructor(data: {
        filter?: {
            uniqueKey: string
        },
        comparator?: string,
        value?: any,
        extraValues?: any
    } = {}) {
        Object.assign(
            this,
            data
        );
    }
}

/**
 * Saved side filter sort
 */
export class SavedFilterDataAppliedSort {
    // data
    sort: {
        uniqueKey: string
    };
    direction: string;

    /**
     * Constructor
     */
    constructor(data: {
        sort?: {
            uniqueKey: string
        },
        direction?: string
    } = {}) {
        Object.assign(
            this,
            data
        );
    }
}

/**
 * Saved side filter data
 */
export class SavedFilterData {
    // data
    appliedFilters: SavedFilterDataAppliedFilter[];
    appliedFilterOperator: string;
    appliedSort: SavedFilterDataAppliedSort[];

    /**
     * Constructor
     */
    constructor(data: {
        appliedFilters?: SavedFilterDataAppliedFilter[],
        appliedFilterOperator?: any,
        appliedSort?: SavedFilterDataAppliedSort[]
    }) {
        data.appliedFilters = _.isArray(data.appliedFilters) ? data.appliedFilters : [];
        this.appliedFilters = _.map(data.appliedFilters, (savedFilter) =>
            savedFilter instanceof SavedFilterDataAppliedFilter ?
                savedFilter :
                new SavedFilterDataAppliedFilter(savedFilter));

        this.appliedFilterOperator = data.appliedFilterOperator;

        data.appliedSort = _.isArray(data.appliedSort) ? data.appliedSort : [];
        this.appliedSort = _.map(data.appliedSort, (savedSort) =>
            savedSort instanceof SavedFilterDataAppliedSort ?
                savedSort :
                new SavedFilterDataAppliedSort(savedSort));
    }
}

/**
 * Saved side filter model
 */
export class SavedFilterModel {
    // data
    id: string;
    name: string;
    isPublic: boolean;
    readOnly: boolean;
    filterKey: string;
    filterData: SavedFilterData;

    /**
     * Constructor
     */
    constructor(data: {
        id?: string,
        name?: string,
        isPublic?: boolean,
        readOnly?: boolean,
        filterKey?: string,
        filterData?: SavedFilterData
    }) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.isPublic = _.get(data, 'isPublic');
        this.readOnly = _.get(data, 'readOnly');
        this.filterKey = _.get(data, 'filterKey');
        this.filterData = new SavedFilterData(_.get(data, 'filterData', {}));
    }
}
