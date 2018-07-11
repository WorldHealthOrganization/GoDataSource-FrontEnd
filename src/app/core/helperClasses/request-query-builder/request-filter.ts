import * as _ from 'lodash';

export enum RequestFilterOperator {
    AND = 'and',
    OR = 'or'
}

export class RequestFilter {
    // conditions to filter by
    private conditions: any[] = [];
    // operator to be applied between conditions
    private operator: RequestFilterOperator = RequestFilterOperator.AND;

    /**
     * Filter by a text field
     * @param {string} property
     * @param {string} value
     * @param {boolean} replace
     */
    byText(property: string, value: string, replace: boolean = true) {
        if (_.isEmpty(value)) {
            // remove filter
            this.remove(property);
        } else {
            // filter with 'startsWith' criteria
            this.where({
                [property]: {
                    regexp: `/^${value}/i`
                }
            }, replace);
        }
    }

    /**
     * Filter by a range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     * @param {boolean} replace
     */
    byRange(property: string, value: any, replace: boolean = true) {
        const fromValue = _.get(value, 'from');
        const toValue = _.get(value, 'to');

        if (_.isEmpty(fromValue) && _.isEmpty(toValue)) {
            // remove filter
            this.remove(property);
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
            this.where({
                [property]: {
                    [operator]: valueToCompare
                }
            }, replace);
        }
    }

    /**
     * Filter by a Select / Multi-Select field
     * @param {string} property
     * @param {any | any[]} values
     * @param {string} valueKey
     * @param {boolean} replace
     */
    bySelect(property: string, values: any | any[], replace: boolean = true, valueKey: string = 'value') {
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
            this.remove(property);
        } else {
            // filter with 'inq' criteria (aka "where in")
            this.where({
                [property]: {
                    inq: values
                }
            }, replace);
        }
    }

    /**
     * Set the operator to be applied between conditions
     * @param {RequestFilterOperator} operator
     * @return {RequestFilter}
     */
    setOperator(operator: RequestFilterOperator) {
        this.operator = operator;

        return this;
    }

    /**
     * Adds a "where" condition
     * Note: If 'replace' is set to 'false', it could add multiple conditions on the same property
     * Note: If 'replace' is set to 'true', if there is already another condition on the same property, it will be replaced
     * @param condition Loopback condition on a property
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    where(condition: any, replace: boolean = false) {

        if (replace) {
            // if there is already a condition on the same property, remove it

            // get the property that the condition applies to
            const property = Object.keys(condition)[0];

            if (
                property !== RequestFilterOperator.AND &&
                property !== RequestFilterOperator.OR
            ) {
                // remove condition(s) on the same property
                this.remove(property);
            }
        }

        // add new condition
        this.conditions.push(condition);

        return this;
    }

    /**
     * Remove condition(s) on a specific property
     * @param {string} property
     * @returns {RequestFilter}
     */
    remove(property: string) {
        this.conditions = _.filter(this.conditions, (condition) => {
            const prop = Object.keys(condition)[0];
            return prop !== property;
        });

        return this;
    }

    /**
     * Remove all conditions
     * @returns {RequestFilter}
     */
    clear() {
        this.conditions = [];

        return this;
    }

    /**
     * Check if there are any conditions set
     * @returns {boolean}
     */
    isEmpty() {
        return this.conditions.length === 0;
    }

    /**
     * Generates a new "where" condition for Loopback API, applying the current filter type between all current conditions
     * @returns {{}}
     */
    generateCondition() {
        return this.isEmpty() ?
            {} :
            {
                [this.operator]: this.conditions
            };
    }
}
