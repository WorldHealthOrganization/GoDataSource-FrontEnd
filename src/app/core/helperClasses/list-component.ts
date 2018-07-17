import { RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';

export abstract class ListComponent {
    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

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
    filterByDeletedField(value: any) {
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

}
