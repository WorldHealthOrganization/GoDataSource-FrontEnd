import * as _ from 'lodash';
import { moment } from '../x-moment';
import { RequestFilterGenerator } from './request-filter-generator';

export enum RequestFilterOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Serialized
 */
export interface ISerializedQueryFilter {
  conditions: any[];
  operator: RequestFilterOperator;
  flags: { [key: string]: any };
  generateConditionsOnFirstLevel: boolean;
  _deleted: boolean;
}

/**
 * Query filters
 */
export class RequestFilter {
  // conditions to filter by
  private conditions: any[] = [];

  // operator to be applied between conditions
  private operator: RequestFilterOperator = RequestFilterOperator.AND;

  // flags
  private flags: { [key: string]: any } = {};

  // migrate conditions to first level
  private generateConditionsOnFirstLevel: boolean = false;

  // flag to include all records (deleted and not deleted)
  private _deleted: boolean;

  // changes listener
  private changesListener: () => void;

  /**
     * Escape string
     * @param value
     */
  static escapeStringForRegex(value: string) {
    return RequestFilterGenerator.escapeStringForRegex(value);
  }

  /**
     * Construct phone regex pattern used by queries
     * @param phoneNumber
     */
  static getPhoneNumberPattern(
    phoneNumber: string
  ): string {
    // nothing provided ?
    if (!phoneNumber) {
      return null;
    }

    // construct search pattern
    const digits: string[] = phoneNumber.match(/[0-9]/g);
    if (
      !digits ||
            digits.length < 1
    ) {
      return null;
    }

    // construct search pattern
    return '^[^0-9]*' + digits.map((digit: string, index: number) => {
      // exclude last check, since we might want to display numbers that start with digits
      return digit + (index < digits.length - 1 ? '[^0-9]*' : '');
    }).join('');
  }

  /**
     * Constructor
     */
  constructor(listener?: () => void) {
    this.changesListener = listener;
  }

  /**
     * Trigger change listener
     */
  private triggerChangeListener(): void {
    // do we have a change listener ?
    if (!this.changesListener) {
      return;
    }

    // trigger change
    this.changesListener();
  }

  /**
     * Include deleted records
     * @returns {RequestFilter}
     */
  includeDeletedRecordsWhereField(): RequestFilter {
    // deleted ?
    this._deleted = true;

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Set flag
     * @param property
     * @param value
     * @returns {RequestFilter}
     */
  flag(property: string, value: any): RequestFilter {
    // flag
    this.flags[property] = value;

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove flag
     * @param property
     * @returns {RequestFilter}
     */
  removeFlag(property: string): RequestFilter {
    // flag
    delete this.flags[property];

    // trigger change
    this.triggerChangeListener();

    // finished
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
     * @param {boolean} useLike
     * @returns {RequestFilter}
     */
  byText(
    property: string,
    value: string,
    replace: boolean = true,
    useLike?: boolean
  ): RequestFilter {
    // do we need to remove condition ?
    if (_.isEmpty(value)) {
      this.remove(property);
    } else {
      // filter with 'startsWith' criteria
      this.where({
        [property]: RequestFilterGenerator.textStartWith(
          value,
          useLike
        )
      }, replace);
    }

    // trigger change
    this.triggerChangeListener();

    // finished
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
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by a text field
     * @param {string} property
     * @param {string} value
     * @param {boolean} replace
     * @param {boolean} useLike
     * @returns {RequestFilter}
     */
  byContainingText(
    property: string,
    value: string,
    replace: boolean = true,
    useLike?: boolean
  ): RequestFilter {
    // do we need to remove condition ?
    if (_.isEmpty(value)) {
      this.remove(property);
    } else {
      // filter with 'contain' criteria
      this.where({
        [property]: RequestFilterGenerator.textContains(
          value,
          useLike
        )
      }, replace);
    }

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by a phone number
     * @param {string} property
     * @param {string} value
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
  byPhoneNumber(
    property: string,
    value: string,
    replace: boolean = true,
    regexMethod: string = 'regex'
  ): RequestFilter {
    // do we need to remove condition ?
    if (_.isEmpty(value)) {
      this.remove(property);
    } else {
      // build number pattern condition
      const phonePattern = RequestFilter.getPhoneNumberPattern(value);

      // nothing to check ?
      if (!phonePattern) {
        // filter by invalid value
        this.where({
          [property]: 'INVALID PHONE'
        }, replace);
      } else {
        // search by phone number
        this.where({
          [property]: {
            [regexMethod]: phonePattern
          }
        }, replace);
      }
    }

    // trigger change
    this.triggerChangeListener();

    // finished
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
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by a boolean field
     * @param {string} property
     * @param {boolean | null | undefined} value
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
  byBoolean(
    property: string,
    value: boolean | null | undefined,
    replace: boolean = true
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by boolean but include "exists" criteria too for a more accurate search
     * @param {string} property
     * @param {boolean} value
     * @param {boolean} replace
     */
  byBooleanUsingExist(
    property: string,
    value: boolean | null | undefined
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by a range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     * @param {boolean} replace
     * @returns {RequestFilter}
     */
  byRange(
    property: string,
    value: any,
    replace: boolean = true
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter by an age range field ('from' / 'to')
     * @param {string} property
     * @param value Object with 'from' and 'to' properties
     * @returns {RequestFilter}
     */
  byAgeRange(
    property: string,
    value: any
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
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
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

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
  bySelect(
    property: string,
    values: any | any[],
    replace: boolean = true,
    valueKey: string = 'value'
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter all records that have a value on a specific field
     * @param property
     */
  byHasValue(
    property: string
  ): RequestFilter {
    // filter no values
    this.where({
      [property]: RequestFilterGenerator.hasValue()
    });

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Filter all records that don't have value on a specific field
     * @param property
     */
  byNotHavingValue(
    property: string
  ): RequestFilter {
    // filter no values
    this.where(
      RequestFilterGenerator.doesntHaveValue(property)
    );

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Set the operator to be applied between conditions
     * @param {RequestFilterOperator} operator
     * @return {RequestFilter}
     */
  setOperator(
    operator: RequestFilterOperator
  ): RequestFilter {
    // operator
    this.operator = operator;

    // trigger change
    this.triggerChangeListener();

    // finished
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
  where(
    condition: any,
    replace: boolean = false
  ): RequestFilter {
    // where condition
    if (replace) {
      // if there is already a condition on the same property, remove it
      this.removeCondition(condition);
    }

    // add new condition
    this.conditions.push(condition);

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove condition(s) on a specific property
     * @param {string} property
     * @returns {RequestFilter}
     */
  remove(
    property: string,
    operator: string = null
  ): RequestFilter {
    // remove conditions
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove a given condition
     * Note: This method could be applied on simple property conditions and on combined conditions with AND / OR operators
     * @param condition
     * @returns {RequestFilter}
     */
  removeCondition(
    condition: any
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove a specific condition with a specific operator on a property
     * Note: Currently, This method could be applied on simple properties only
     * @param condition
     * @returns {RequestFilter}
     */
  removeExactCondition(
    condition: any
  ): RequestFilter {
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove child conditions that match path (path may or not contain the index from an array, if it does it will remove only that item index if it matches, if it doesn't it will remove all items that match)
     * Usages:
     * - path = 'and.and.address' | 'and.and.addresses'
     * - path = 'and.and.0.address' | 'and.and.0.addresses'
     */
  removePathCondition(
    path: string
  ): RequestFilter {
    // if path empty we have nothing to remove
    if (!path) {
      return this;
    }

    // determine path elements
    const pathElements: string[] = path.split('.');

    // recursive check of element
    const checkPathElement = (
      condition: any,
      localPathElementIndex: number
    ): void => {
      // no condition to check / remove ?
      if (!condition) {
        return;
      }

      // go through all conditions and check if we have one that matches out path element
      const conditionProperties: string[] = Object.keys(condition);
      conditionProperties.forEach((conditionKey) => {
        // not our condition that we need to remove ?
        if (
          conditionKey !== pathElements[localPathElementIndex] &&
                    !conditionKey.startsWith(`${pathElements[localPathElementIndex]}.`)
        ) {
          return;
        }

        // this is the condition that we need to remove ?
        if (localPathElementIndex + 1 === pathElements.length) {
          // remove condition
          delete condition[conditionKey];

          // finished
          return;
        }

        // if array then we need to threat it in two different ways
        // - path may or not contain the index from an array, if it does it will remove only that item index if it matches
        // - if it doesn't it will remove all items that match
        if (_.isArray(condition[conditionKey])) {
          if (_.get(condition[conditionKey], pathElements[localPathElementIndex + 1]) === undefined) {
            (condition[conditionKey] as any[]).forEach((childCondition: any, childIndex: number) => {
              // check child
              checkPathElement(
                childCondition,
                localPathElementIndex + 1
              );

              // if child condition was removed then we need to check parent if empty and remove it too
              if (_.isEmpty(childCondition)) {
                delete condition[conditionKey][childIndex];
              }
            });
          } else {
            // this is the condition that we need to remove ?
            if (localPathElementIndex + 2 === pathElements.length) {
              // remove condition
              delete condition[pathElements[localPathElementIndex + 1]];

              // finished
              return;
            } else {
              // check child
              checkPathElement(
                condition[conditionKey][pathElements[localPathElementIndex + 1]],
                localPathElementIndex + 2
              );
            }
          }

          // remove empty deleted items
          condition[conditionKey] = [...condition[conditionKey]].filter((childCondition) => !_.isEmpty(childCondition));
        } else {
          // need to look further - recursive into condition children for remaining path elements ?
          checkPathElement(
            condition[conditionKey],
            localPathElementIndex++
          );
        }

        // if child condition was removed then we need to check parent if empty and remove it too
        if (_.isEmpty(condition[conditionKey])) {
          delete condition[conditionKey];
        }
      });
    };

    // go through condition and see if we can find our path
    (this.conditions || []).forEach((condition: any, conditionIndex) => {
      checkPathElement(
        condition,
        0
      );

      // if child condition was removed then we need to check parent if empty and remove it too
      if (_.isEmpty(condition)) {
        delete this.conditions[conditionIndex];
      }
    });

    // remove empty deleted items
    this.conditions = [...this.conditions].filter((childCondition) => !_.isEmpty(childCondition));

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
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
     * Retrieve condition
     * @param property
     */
  get(property: string): any {
    return _.find(this.conditions, (condition) => {
      return Object.keys(condition)[0] === property;
    });
  }

  /**
     * Remove all operations of a given type on a list of properties
     * @param {RequestFilterOperator} operator
     * @param {string[]} properties
     * @returns {RequestFilter}
     */
  removeOperation(
    operator: RequestFilterOperator,
    properties: string[]
  ): RequestFilter {
    // remove operation
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

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Remove all conditions
     * @returns {RequestFilter}
     */
  clear(): RequestFilter {
    // clear
    this.conditions = [];
    this.flags = {};

    // trigger change
    this.triggerChangeListener();

    // finished
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
  firstLevelConditions(): RequestFilter {
    // generate first level condition ?
    this.generateConditionsOnFirstLevel = true;

    // trigger change
    this.triggerChangeListener();

    // finished
    return this;
  }

  /**
     * Generate conditions on multilevel ( add operator, etc ... )
     */
  multiLevelConditions(): RequestFilter {
    // multiple level condition ?
    this.generateConditionsOnFirstLevel = false;

    // trigger change
    this.triggerChangeListener();

    // finished
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
  ): any {
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

    // set includeDeletedRecords on filter if this._deleted has a value
    if (this._deleted !== undefined) {
      condition.includeDeletedRecords = this._deleted;
    }

    // append flags
    if (!ignoreFlags) {
      condition = Object.assign(
        condition,
        this.flags
      );
    }

    // finished
    return stringified ? JSON.stringify(condition) : condition;
  }

  /**
     * Generates a new "where" condition for Loopback API, applying the current filter type between all current conditions
     * Only first condition is returned
     * @param {boolean} stringified
     * @param {boolean} includeWhere
     * @returns {{}}
     */
  generateFirstCondition(
    stringified: boolean = false,
    includeWhere: boolean = false
  ): any {
    // setup
    let returnCondition: any;
    const condition = this.isEmpty() || this.conditions.length < 1 ?
      {} : this.conditions[0];
    // include or not the 'where' property
    if (includeWhere) {
      returnCondition = { where: condition };
    } else {
      returnCondition = condition;
    }

    // finished
    return stringified ? JSON.stringify(returnCondition) : returnCondition;
  }

  /**
     * Serialize query builder
     */
  serialize(): ISerializedQueryFilter {
    return {
      conditions: this.conditions,
      operator: this.operator,
      flags: this.flags,
      generateConditionsOnFirstLevel: this.generateConditionsOnFirstLevel,
      _deleted: this._deleted
    };
  }

  /**
     * Replace query builder filters with saved ones
     */
  deserialize(
    serializedValue: string | ISerializedQueryFilter
  ): void {
    // deserialize
    const serializedValueObject: ISerializedQueryFilter = _.isString(serializedValue) ?
      JSON.parse(serializedValue) :
      serializedValue as ISerializedQueryFilter;

    // update data
    this.conditions = serializedValueObject.conditions;
    this.operator = serializedValueObject.operator;
    this.flags = serializedValueObject.flags;
    this.generateConditionsOnFirstLevel = serializedValueObject.generateConditionsOnFirstLevel;
    this._deleted = serializedValueObject._deleted;
  }
}
