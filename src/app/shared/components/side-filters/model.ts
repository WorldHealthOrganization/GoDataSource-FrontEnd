// filter operations
import { Observable } from 'rxjs/Observable';

// filter types
export enum FilterType {
    TEXT = 'text',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    RANGE = 'range'
}

// Model for Available Filter
export class FilterModel {

    self: FilterModel;

    constructor(
        // name of the field that the filter applies to
        public fieldName: string,
        // filter type
        public type: FilterType,
        // select options for SELECT and MULTISELECT filter types
        public options$: Observable<any[]> = null
    ) {
        this.self = this;
    }
}

// Model for Applied Filter
export class AppliedFilterModel {
    // applied filter
    public filter: FilterModel;
    // selected value for the filter
    public value: any;
}
