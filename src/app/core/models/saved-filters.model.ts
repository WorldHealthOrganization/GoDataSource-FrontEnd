import * as _ from 'lodash';

export class SavedFilterDataAppliedFilter {
    filter: {
        uniqueKey: string
    };
    comparator: string;
    value: any;

    constructor(data: {
        filter?: {
            uniqueKey: string
        },
        comparator?: string,
        value?: any
    } = {}) {
        Object.assign(
            this,
            data
        );
    }
}

export class SavedFilterDataAppliedSort {
    sort: {
        uniqueKey: string
    };
    direction: string;

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

export class SavedFilterData {
    appliedFilters: SavedFilterDataAppliedFilter[];
    appliedFilterOperator: string;
    appliedSort: SavedFilterDataAppliedSort[];

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

export class SavedFilterModel {
    id: string;
    name: string;
    isPublic: boolean;
    readonly: boolean;
    filterKey: string;
    filterData: SavedFilterData;

    constructor(data: {
        id?: string,
        name?: string,
        isPublic?: boolean,
        readonly?: boolean,
        filterKey?: string,
        filterData?: SavedFilterData
    }) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.isPublic = _.get(data, 'isPublic', false);
        this.readonly = _.get(data, 'readonly', false);
        this.filterKey = _.get(data, 'filterKey');
        this.filterData = new SavedFilterData(_.get(data, 'filterData', {}));
    }
}
