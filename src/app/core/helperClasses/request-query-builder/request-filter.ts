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
    // flags
    private flags: { [key: string]: any } = {};

    /**
     * Set flag
     * @param property
     * @param value
     * @returns {RequestFilter}
     */
    flag(property: string, value: any) {
        this.flags[property] = value;
        return this;
    }

    /**
     * Remove flag
     * @param property
     * @returns {RequestFilter}
     */
    removeFlag(property: string) {
        delete this.flags[property];
        return this;
    }

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
     * Filter by a boolean field
     * @param {string} property
     * @param {boolean | null | undefined} value
     * @param {boolean} replace
     */
    byBoolean(property: string, value: boolean | null | undefined, replace: boolean = true) {
        // handle property removal
        const removeCondition = () => {
            // remove filter
            this.remove(property);

            // remove OR condition
            this.removeOperation(RequestFilterOperator.OR, [property, property]);
        };

        // nothing to filter ?
        if (!_.isBoolean(value)) {
            removeCondition();
        } else {
            // remove filter
            if (replace) {
                removeCondition();
            }

            // add new filter
            if (value) {
                // filter
                this.where({
                    [property]: true
                });
            } else {
                // filter
                this.where({
                    or: [
                        { [property]: false },
                        { [property]: { eq: null } }
                    ]
                });
            }
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

        const fromValueIsEmpty: boolean = !_.isNumber(fromValue) && _.isEmpty(fromValue);
        const toValueIsEmpty: boolean = !_.isNumber(toValue) && _.isEmpty(toValue);

        if (fromValueIsEmpty && toValueIsEmpty) {
            // remove filter
            this.remove(property);
        } else {
            // filter by range (from / to)

            // determine operator & value
            let operator;
            let valueToCompare;
            if (!fromValueIsEmpty && !toValueIsEmpty) {
                operator = 'between';
                valueToCompare = [fromValue, toValue];
            } else if (!fromValueIsEmpty) {
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
            this.removeCondition(condition);
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
     * Remove a given condition
     * Note: This method could be applied on simple property conditions and on combined conditions with AND / OR operators
     * @param condition
     * @returns {RequestFilter}
     */
    removeCondition(condition: any) {
        // get the property that the condition applies to
        const property = Object.keys(condition)[0];

        if (
            property !== RequestFilterOperator.AND &&
            property !== RequestFilterOperator.OR
        ) {
            // remove condition(s) on the property
            this.remove(property);
        } else {
            // it is an AND/OR operation
            const operator = property;
            // find condition properties
            const properties = _.map(condition[operator], (conditionProp) => {
                return Object.keys(conditionProp)[0];
            });

            // remove condition
            this.removeOperation(operator, properties);
        }

        return this;
    }

    /**
     * Remove all operations of a given type on a list of properties
     * @param {RequestFilterOperator} operator
     * @param {string[]} properties
     * @returns {RequestFilter}
     */
    removeOperation(operator: RequestFilterOperator, properties: string[]) {
        this.conditions = _.filter(this.conditions, (condition) => {
            const prop = Object.keys(condition)[0];

            if (prop !== operator) {
                return true;
            }

            const conditionProperties = _.map(condition.or, (conditionProp) => {
                return Object.keys(conditionProp)[0];
            });

            return !_.isEqual(conditionProperties, properties);
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
    generateCondition(stringified: boolean = false) {
        let condition = this.isEmpty() ?
            {} :
            {
                [this.operator]: this.conditions
            };

        // append flags
        condition = Object.assign(
            condition,
            this.flags
        );

        return stringified ? JSON.stringify(condition) : condition;
    }
}
