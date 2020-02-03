import * as _ from 'lodash';
import { moment } from '../x-moment';
import { RequestFilterGenerator } from './request-filter-generator';

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
    // migrate conditions to first level
    private generateConditionsOnFirstLevel: boolean = false;

    /**
     * Escape string
     * @param value
     */
    static escapeStringForRegex(value: string) {
        return RequestFilterGenerator.escapeStringForRegex(value);
    }

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
     * Get Flags
     */
    getFlags(): { [key: string]: any } {
        return _.cloneDeep(this.flags);
    }

    /**
     * Filter by a text field
     * @param {string} property
     * @param {string} value
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    byText(
        property: string,
        value: string,
        replace: boolean = true
    ) {
        // do we need to remove condition ?
        if (_.isEmpty(value)) {
            this.remove(property);
        } else {
            // filter with 'startsWith' criteria
            this.where({
                [property]: RequestFilterGenerator.textStartWith(value)
            }, replace);
        }

        return this;
    }

    /**
     * Filter by a text field
     * @param {string[]} properties
     * @param {string} value
     * @param {boolean} replace
     * @param {string} operator Default => 'or'
     * @returns {RequestFilter}
     */
    byTextMultipleProperties(
        properties: string[],
        value: string,
        replace: boolean = true,
        operator: RequestFilterOperator = RequestFilterOperator.OR
    ) {
        // construct or condition if necessary
        const condition = {
            [operator]: _.map(properties, (prop) => ({
                [prop]: RequestFilterGenerator.textStartWith(value)
            }))
        };

        // do we need to remove condition ?
        if (_.isEmpty(value)) {
            this.removeCondition(condition);
        } else {
            // filter with 'startsWith' criteria
            this.where(condition, replace);
        }

        return this;
    }

    /**
     * Filter by a text field
     * @param {string} property
     * @param {string} value
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    byContainingText(
        property: string,
        value: string,
        replace: boolean = true
    ) {
        // do we need to remove condition ?
        if (_.isEmpty(value)) {
            this.remove(property);
        } else {
            // filter with 'startsWith' criteria
            this.where({
                [property]: RequestFilterGenerator.textContains(value)
            }, replace);
        }
        return this;
    }

    /**
     * Filter by comparing a field if it is equal to the provided value
     * @param {string} property
     * @param {string | number} value
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    byEquality(
        property: string,
        value: string | number,
        replace: boolean = true,
        caseInsensitive: boolean = false
    ) {
        if (
            _.isEmpty(value) &&
            !_.isNumber(value)
        ) {
            // remove filter
            this.remove(property);
        } else {
            // use regexp for case insensitive compare
            if (caseInsensitive) {
                this.where({
                    [property]: RequestFilterGenerator.textIs(value as string)
                }, replace);
            } else {
                // case sensitive search
                // we don't use "regex" ( ? and % ) special characters in this case
                // !!! changing this to regex breaks a few things !!!
                this.where({
                    [property]: value
                }, replace);
            }
        }

        return this;
    }

    /**
     * Filter by a boolean field
     * @param {string} property
     * @param {boolean | null | undefined} value
     * @param {boolean} replace
     * @returns {RequestFilter}
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
                        {[property]: false},
                        {[property]: {eq: null}}
                    ]
                });
            }
        }

        return this;
    }

    /**
     * Filter by boolean but include "exists" criteria too for a more accurate search
     * @param {string} property
     * @param {boolean} value
     * @param {boolean} replace
     */
    byBooleanUsingExist(property: string, value: boolean | null | undefined) {
        // create condition with OR criteria
        const orCondition = {
            or: [
                {
                    [property]: {
                        eq: value
                    }
                },
                {
                    [property]: {
                        exists: value
                    }
                }
            ]
        };

        // remove existing property and condition
        this.remove(property);
        this.removeCondition(orCondition);

        // apply filter
        if (value === false) {
            this.where(orCondition);
        } else if (value === true) {
            this.where({
                [property]: {
                    eq: true
                }
            });
        }
    }

    /**
     * Filter by a range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     * @param {boolean} replace
     * @returns {RequestFilter}
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
            this.where({
                [property]: RequestFilterGenerator.rangeCompare(value)
            }, replace);
        }

        return this;
    }

    /**
     * Filter by an age range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    byAgeRange(property: string, value: any, replace: boolean = true) {
        // remove conditions
        this.remove(`${property}.months`);
        this.remove(`${property}.years`);
        this.removeCondition({
            or: [
                { [`${property}.months`]: true },
                { [`${property}.years`]: true }
            ]
        });

        // determine what filters we need to add
        const fromValue: number = _.isNumber(value.from) ? value.from : null;
        const toValue: number = _.isNumber(value.to) ? value.to : null;

        // do we need to add any conditions ?
        if (
            fromValue !== null ||
            toValue !== null
        ) {
            // construct array of conditions
            let operator;
            let valueToCompare;

            // between
            if (
                fromValue !== null &&
                toValue !== null
            ) {
                operator = 'between';
                valueToCompare = [fromValue, toValue];
            } else if (
                fromValue !== null
            ) {
                operator = 'gte';
                valueToCompare = fromValue;
            } else {
                operator = 'lte';
                valueToCompare = toValue;
            }

            // single condition ( either years or months )
            this.where({
                [`${property}.years`]: {
                    [operator]: valueToCompare
                }},
                true
            );
        }

        return this;
    }

    /**
     * Filter by date range
     * @param property
     * @param value
     * @param replace
     */
    byDateRange(
        property: string,
        value: any,
        replace: boolean = true
    ) {
        // no point in continuing if we got an empty value
        if (_.isEmpty(value)) {
            this.remove(property);
            return;
        }

        // convert date range to simple range
        const rangeValue: any = {};
        if (value.startDate) {
            rangeValue.from = value.startDate.toISOString ? value.startDate.toISOString() : moment(value.startDate).toISOString();
        }
        if (value.endDate) {
            rangeValue.to = value.endDate.toISOString ? value.endDate.toISOString() : moment(value.endDate).toISOString();
        }

        // filter by range
        this.byRange(
            property,
            rangeValue,
            replace
        );

        // finished
        return this;
    }

    /**
     * Filter by a Select / Multi-Select field
     * @param {string} property
     * @param {any | any[]} values
     * @param {string} valueKey
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
    bySelect(property: string, values: any | any[], replace: boolean = true, valueKey: string = 'value') {
        // sanitize the 'values' to filter by
        if (!_.isArray(values)) {
            values = [values];
        }

        // convert Objects returned by the Select element to string values
        if (valueKey) {
            values = _.map(values, (value) => {
                return value[valueKey];
            });
        }

        if (_.isEmpty(values)) {
            if (replace) {
                // remove filter
                this.remove(property);
            } else {
                // remove only conditions with exact operator
                this.removeExactCondition({
                    [property]: {inq: []}
                });
            }
        } else {
            // filter with 'inq' criteria (aka "where in")
            this.where({
                [property]: {
                    inq: values
                }
            }, replace);
        }

        return this;
    }

    /**
     * Filter all records that have a value on a specific field
     * @param property
     */
    byHasValue(
        property: string
    ) {
        // filter no values
        this.where({
            [property]: RequestFilterGenerator.hasValue()
        });

        // finished
        return this;
    }

    /**
     * Filter all records that don't have value on a specific field
     * @param property
     */
    byNotHavingValue(
        property: string
    ) {
        // filter no values
        this.where(
            RequestFilterGenerator.doesntHaveValue(property)
        );

        // finished
        return this;
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
    remove(property: string, operator: string = null) {
        this.conditions = _.filter(this.conditions, (condition) => {
            const prop = Object.keys(condition)[0];

            if (
                prop.length > 0 &&
                // remove only some conditions with a given operator?
                operator !== null &&

                // do we have data on this property ?
                condition[property] !== undefined
            ) {
                // get the operator
                const op = Object.keys(condition[property])[0];
                return prop !== property || op !== operator;
            } else {
                // remove all conditions on property
                return prop !== property;
            }
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
     * Remove a specific condition with a specific operator on a property
     * Note: Currently, This method could be applied on simple properties only
     * @param condition
     * @returns {RequestFilter}
     */
    removeExactCondition(condition: any) {
        // sanitize condition
        condition = condition || {};

        // get the property that the condition applies to
        const property = Object.keys(condition)[0];

        if (property.length > 0) {
            // get the operator
            const operator = Object.keys(condition[property])[0];

            if (operator) {
                this.remove(property, operator);
            }
        }
    }

    /**
     * Check if a key is used in a condition
     * @param property
     */
    has(property: string): boolean {
        return _.find(this.conditions, (condition) => {
            return Object.keys(condition)[0] === property;
        }) !== undefined;
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
        this.flags = {};

        return this;
    }

    /**
     * Check if there are any conditions set
     * @returns {boolean}
     */
    isEmpty() {
        return this.conditions.length === 0 &&
            _.isEmpty(this.flags);
    }

    /**
     * Generate conditions on first level
     */
    firstLevelConditions() {
        this.generateConditionsOnFirstLevel = true;
        return this;
    }

    /**
     * Generate conditions on multilevel ( add operator, etc ... )
     */
    multiLevelConditions() {
        this.generateConditionsOnFirstLevel = false;
        return this;
    }

    /**
     * Generates a new "where" condition for Loopback API, applying the current filter type between all current conditions
     * @param {boolean} stringified
     * @returns {{}}
     */
    generateCondition(
        stringified: boolean = false,
        ignoreFlags: boolean = false
    ) {
        // first level conditions ?
        let condition;
        if (this.generateConditionsOnFirstLevel) {
            condition = _.transform(this.conditions, (result, conditionData) => {
                // this could overwrite other conditions with the same property, but since API isn't able to process multi level conditions in this case..it won't matter if we overwrite it...
                _.each(conditionData, (data, property) => {
                    result[property] = data;
                });
            }, {});
        } else {
            condition = this.conditions.length === 0 ?
                {} :
                {
                    [this.operator]: this.conditions
                };
        }

        // append flags
        if (!ignoreFlags) {
            condition = Object.assign(
                condition,
                this.flags
            );
        }

        return stringified ? JSON.stringify(condition) : condition;
    }

    /**
     * Generates a new "where" condition for Loopback API, applying the current filter type between all current conditions
     * Only first condition is returned
     * @param {boolean} stringified
     * @param {boolean} includeWhere
     * @returns {{}}
     */
    generateFirstCondition(stringified: boolean = false, includeWhere: boolean = false ) {
        let returnCondition: any;
        const condition = this.isEmpty() || this.conditions.length < 1 ?
            {} : this.conditions[0];
        // include or not the 'where' property
        if (includeWhere) {
            returnCondition = { where: condition };
        } else {
            returnCondition = condition;
        }
        return stringified ? JSON.stringify(returnCondition) : returnCondition;
    }
}
