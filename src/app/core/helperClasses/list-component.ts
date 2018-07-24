import { RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';
import { ListFilterDataService } from '../services/data/list-filter.data.service';
import { Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../models/constants';

export abstract class ListComponent {
    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();


    protected constructor(
        protected listFilterDataService: ListFilterDataService = null,
        protected queryParams: Observable<Params> = null
    ) {
        this.checkListFilters();
    }


    /**
     * Refresh list
     */
    public abstract refreshList();

    /**
     * Sort asc / desc by specific fields
     * @param data
     */
    public sortBy(data) {
        const property = _.get(data, 'active');
        const direction = _.get(data, 'direction');

        if (direction) {
            // apply sort
            this.queryBuilder.sort.by(property, direction);
        } else {
            // remove sort
            this.queryBuilder.sort.remove(property);
        }

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByTextField(property: string, value: string) {
        this.queryBuilder.filter.byText(property, value);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByBooleanField(property: string, value: boolean | null | undefined) {
        this.queryBuilder.filter.byBoolean(property, value);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     */
    filterByRangeField(property: string, value: any) {
        this.queryBuilder.filter.byRange(property, value);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a Select / Multi-Select field
     * @param {string} property
     * @param {any | any[]} values
     * @param {string} valueKey
     */
    filterBySelectField(property: string, values: any | any[], valueKey: string = 'value') {
        this.queryBuilder.filter.bySelect(property, values, true, valueKey);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter by deleted field
     * @param value
     */
    filterByDeletedField(value: boolean | null | undefined) {
        // filter
        if (value === false) {
            this.queryBuilder.excludeDeleted();
            this.queryBuilder.filter.remove('deleted');
        } else {
            this.queryBuilder.includeDeleted();
            if (value === true) {
                this.queryBuilder.filter.where({
                    'deleted': {
                        'eq': true
                    }
                }, true);
            } else {
                this.queryBuilder.filter.remove('deleted');
            }
        }

        // refresh list
        this.refreshList();
    }

    /**
     * Apply the filters selected from the Side Filters section
     * @param {RequestQueryBuilder} queryBuilder
     */
    applySideFilters(queryBuilder: RequestQueryBuilder) {
        this.queryBuilder = queryBuilder;

        // refresh list
        this.refreshList();
    }

    /**
     *  Check if list filter applies
     */
    protected checkListFilters() {
        if (!_.isEmpty(this.queryParams) && !_.isEmpty(this.listFilterDataService)) {
            // get query params
            this.queryParams
                .subscribe(params => {
                    if (!_.isEmpty(params)) {
                        // call function to apply filters - update query buiilder
                        this.applyListFilters(params);
                    }
                });
        }
    }

    protected applyListFilters(queryParams) {
        // check params for apply list filter
        switch (queryParams.applyListFilter) {
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsOnFollowUpListsFromDashboard()
                    .subscribe((filterQueryBuilder) => {
                        // remove property 'id' to not duplicate the conditions
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
                        // refresh list
                        this.refreshList();
                    });
        }
    }

}
