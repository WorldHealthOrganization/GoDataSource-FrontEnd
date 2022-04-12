import { RequestFilter, RequestFilterOperator, RequestQueryBuilder } from './request-query-builder';
import { IV2NumberRange } from '../../shared/forms-v2/components/app-form-number-range-v2/models/number.model';
import { moment, Moment } from './x-moment';
import * as _ from 'lodash';
import { IV2DateRange } from '../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';
import { AddressModel } from '../models/address.model';
import { IExtendedColDef } from '../../shared/components-v2/app-list-table-v2/models/extended-column.model';
import { V2FilterTextType, V2FilterType } from '../../shared/components-v2/app-list-table-v2/models/filter.model';

/**
 * Applied filters
 */
export abstract class ListQueryComponent {
  // query
  protected queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(this.queryBuilderChangedCallback);

  // filters applied ?
  get filtersApplied(): boolean {
    return !this.queryBuilder.isEmptyOnlyFilters();
  }

  /**
   * Constructor
   */
  protected constructor(
    private queryBuilderChangedCallback: () => void,
    private refreshCall: (
      instant?: boolean,
      resetPagination?: boolean,
      triggeredByPageChange?: boolean
    ) => void
  ) {}

  /**
   * Filter the list by a text field
   */
  protected filterByTextField(
    property: string | string[],
    value: string,
    operator?: RequestFilterOperator,
    useLike?: boolean
  ) {
    // default values
    if (operator === undefined) {
      operator = RequestFilterOperator.OR;
    }

    // filter
    if (_.isArray(property)) {
      this.queryBuilder.filter.byTextMultipleProperties(
        property as string[],
        value,
        true,
        operator
      );
    } else {
      this.queryBuilder.filter.byText(
        property as string,
        value,
        true,
        useLike
      );
    }

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter by phone number
   */
  protected filterByPhoneNumber(
    property: string,
    value: string,
    regexMethod: string = 'regex'
  ) {
    this.queryBuilder.filter.byPhoneNumber(
      property as string,
      value,
      true,
      regexMethod
    );

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by equality
   */
  protected filterByEquality(
    property: string | string[],
    value: any
  ) {
    this.queryBuilder.filter.byEquality(
      property as string,
      value
    );

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a text field
   */
  protected filterByTextContainingField(
    property: string,
    value: string,
    useLike?: boolean
  ) {
    this.queryBuilder.filter.byContainingText(
      property as string,
      value,
      true,
      useLike
    );

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a text field
   */
  protected filterByBooleanField(
    property: string,
    value: boolean | null | undefined
  ) {
    this.queryBuilder.filter.byBoolean(property, value);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter all records that don't have value on a specific field
   */
  protected filterByNotHavingValue(
    property: string
  ): void {
    // filter
    this.queryBuilder.filter.byNotHavingValue(property);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a range field ('from' / 'to')
   */
  protected filterByRangeField(property: string, value: IV2NumberRange) {
    this.queryBuilder.filter.byRange(property, value);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by an age range field ('from' / 'to')
   */
  protected filterByAgeRangeField(
    property: string,
    value: IV2NumberRange
  ) {
    // filter by age range
    this.queryBuilder.filter.byAgeRange(property, value);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a date field ( startOf day => endOf day )
   */
  protected filterByDateField(
    property: string,
    value: Moment
  ) {
    // filter by date
    if (_.isEmpty(value)) {
      this.queryBuilder.filter.byDateRange(property, value);
    } else {
      this.queryBuilder.filter.byDateRange(
        property, {
          startDate: moment(value).startOf('day'),
          endDate: moment(value).endOf('day')
        }
      );
    }

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a date range field ('startDate' / 'endDate')
   */
  protected filterByDateRangeField(
    property: string,
    value: IV2DateRange
  ) {
    // filter by date range
    this.queryBuilder.filter.byDateRange(property, value);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter the list by a Select / Multi-Select field
   */
  protected filterBySelectField(
    property: string,
    values: any | any[],
    valueKey: string = 'value',
    replace: boolean = true
  ) {
    // no value ?
    if (values === false) {
      this.queryBuilder.filter.byBoolean(
        property,
        false,
        true
      );
    } else {
      this.queryBuilder.filter.bySelect(property, values, replace, valueKey);
    }

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter by boolean with exists condition
   */
  protected filterByBooleanUsingExistField(
    property: string,
    value: any
  ) {
    // filter by boolean using exist
    this.queryBuilder.filter.byBooleanUsingExist(property, value);

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter by current address
   */
  protected filterByAddress(
    property: string,
    isArray: boolean,
    addressModel: AddressModel,
    addressParentLocationIds: string[],
    useLike: boolean = false
  ) {
    // remove the previous conditions
    this.queryBuilder.filter.removePathCondition('address');
    this.queryBuilder.filter.removePathCondition('addresses');
    this.queryBuilder.filter.removePathCondition('and.address');
    this.queryBuilder.filter.removePathCondition('and.addresses');

    // create a query builder
    const searchQb: RequestQueryBuilder = AddressModel.buildAddressFilter(
      property,
      isArray,
      addressModel,
      addressParentLocationIds,
      useLike
    );

    // add condition if we were able to create it
    if (
      searchQb &&
      !searchQb.isEmpty()
    ) {
      this.queryBuilder.merge(searchQb);
    }

    // refresh list
    this.refreshCall();
  }

  /**
   * Filter by deleted field
   */
  protected filterByDeletedField(
    value: boolean | ''
  ) {
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
    this.refreshCall();
  }

  /**
   * Filter by relation
   */
  protected filterByRelation(
    relation: string | string[]
  ): RequestFilter {
    // make sure we always have an array of relations
    const relations: string[] = (_.isArray(relation) ?
      relation :
      [relation]
    ) as string[];

    // go through all the relations until we get the desired query builder
    let relationQB: RequestQueryBuilder = this.queryBuilder;
    _.each(relations, (rel: string) => {
      relationQB = relationQB.include(rel).queryBuilder;
    });

    // refresh list
    // this one isn't executed instantly, so there should be enough time to setup the relation filter
    this.refreshCall();

    // retrieve filter
    return relationQB.filter;
  }

  /**
   * Filter by child query builder
   */
  protected filterByChildQueryBuilder(
    qbFilterKey: string
  ): RequestFilter {
    const childQueryBuilder = this.queryBuilder.addChildQueryBuilder(qbFilterKey);

    // refresh list
    this.refreshCall();

    return childQueryBuilder.filter;
  }

  /**
   * Filter by
   */
  filterBy(column: IExtendedColDef): void {
    // custom filter ?
    if (column.columnDefinition.filter.search) {
      // call
      column.columnDefinition.filter.search(column);

      // finished
      return;
    }

    // filter accordingly
    switch (column.columnDefinition.filter.type) {

      // text
      case V2FilterType.TEXT:

        // text filter type
        switch (column.columnDefinition.filter.textType) {
          case V2FilterTextType.STARTS_WITH:

            // filter
            this.filterByTextField(
              column.columnDefinition.field,
              column.columnDefinition.filter.value
            );

            // finished
            break;
        }

        // finished
        break;

      // multiple select
      case V2FilterType.MULTIPLE_SELECT:
        // filter
        this.filterBySelectField(
          column.columnDefinition.field,
          column.columnDefinition.filter.value,
          null,
          true
        );

        // finished
        break;

      // date range
      case V2FilterType.DATE_RANGE:
        // filter
        this.filterByDateRangeField(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // age range - years
      case V2FilterType.AGE_RANGE:
        // filter
        this.filterByAgeRangeField(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // address
      case V2FilterType.ADDRESS_PHONE_NUMBER:
      case V2FilterType.ADDRESS_MULTIPLE_LOCATION:
      case V2FilterType.ADDRESS_FIELD:
      case V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION:
        // filter
        this.filterByAddress(
          column.columnDefinition.filter.field,
          column.columnDefinition.filter.fieldIsArray,
          column.columnDefinition.filter.address,
          column.columnDefinition.filter.address.filterLocationIds,
          (column.columnDefinition.filter as any).useLike
        );

        // finished
        break;

      // boolean
      case V2FilterType.BOOLEAN:
        // filter
        this.filterByBooleanUsingExistField(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // number range
      case V2FilterType.NUMBER_RANGE:
        // filter
        this.filterByRangeField(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // deleted
      case V2FilterType.DELETED:
        // filter
        this.filterByDeletedField(column.columnDefinition.filter.value);

        // finished
        break;
    }
  }
}
