import { RequestQueryBuilder } from '../services/helper/request-query-builder';
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
        // sort by
        this.queryBuilder.sort(data);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by some text field
     * @param {string} property
     * @param {string} value
     */
    filterTextBy(property: string, value: string) {
        if (_.isEmpty(value)) {
            // remove filter
            this.queryBuilder.whereRemove(property);
        } else {
            // filter with 'startsWith' criteria
            this.queryBuilder.where({
                [property]: {
                    regexp: `/^${value}/i`
                }
            });
        }

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by some range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     */
    filterRangeBy(property: string, value: any) {
        const fromValue = _.get(value, 'from');
        const toValue = _.get(value, 'to');

        if (_.isEmpty(fromValue) && _.isEmpty(toValue)) {
            // remove filter
            this.queryBuilder.whereRemove(property);
        } else {
            // filter by range (from / to)

            // determine operator & value
            let operator;
            let valueToCompare;
            if (!_.isEmpty(fromValue) && !_.isEmpty(toValue)) {
                operator = 'between';
                valueToCompare = [fromValue, toValue];
            } else if (!_.isEmpty(fromValue)) {
                operator = 'gte';
                valueToCompare = fromValue;
            } else {
                operator = 'lte';
                valueToCompare = toValue;
            }

            // filter
            this.queryBuilder.where({
                [property]: {
                    [operator]: valueToCompare
                }
            });
        }

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by some Select (Dropdown) field
     * Note: This filter can be used for Single Select and Multi Select elements
     * @param {string} property
     * @param {any | any[]} values
     * @param {string} valueKey
     */
    filterSelectBy(property: string, values: any | any[], valueKey: string = 'value') {
        // sanitize the 'values' to filter by
        if (!_.isArray(values)) {
            values = [values];
        }

        // convert Objects returned by the Select element to string values
        values = _.map(values, (value) => {
            return value[valueKey];
        });

        if (_.isEmpty(values)) {
            // remove filter
            this.queryBuilder.whereRemove(property);
        } else {
            // filter with 'inq' criteria (aka "where in")
            this.queryBuilder.where({
                [property]: {
                    inq: values
                }
            });
        }

        // refresh list
        this.refreshList();
    }
}
