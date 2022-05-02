import { RequestQueryBuilder } from './request-query-builder';
import { AddressModel } from '../models/address.model';
import { IExtendedColDef } from '../../shared/components-v2/app-list-table-v2/models/extended-column.model';
import { V2FilterTextType, V2FilterType } from '../../shared/components-v2/app-list-table-v2/models/filter.model';
import { AppFormSelectMultipleV2Component } from '../../shared/forms-v2/components/app-form-select-multiple-v2/app-form-select-multiple-v2.component';

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

  // /**
  //  * Filter the list by a text field
  //  */
  // protected filterByTextContainingField(
  //   property: string,
  //   value: string,
  //   useLike?: boolean
  // ) {
  //   this.queryBuilder.filter.byContainingText(
  //     property as string,
  //     value,
  //     true,
  //     useLike
  //   );
  //
  //   // refresh list
  //   this.refreshCall();
  // }
  //
  // /**
  //  * Filter the list by a text field
  //  */
  // protected filterByBooleanField(
  //   property: string,
  //   value: boolean | null | undefined
  // ) {
  //   this.queryBuilder.filter.byBoolean(property, value);
  //
  //   // refresh list
  //   this.refreshCall();
  // }
  //
  // /**
  //  * Filter the list by a date field ( startOf day => endOf day )
  //  */
  // protected filterByDateField(
  //   property: string,
  //   value: Moment
  // ) {
  //   // filter by date
  //   if (_.isEmpty(value)) {
  //     this.queryBuilder.filter.byDateRange(property, value);
  //   } else {
  //     this.queryBuilder.filter.byDateRange(
  //       property, {
  //         startDate: moment(value).startOf('day'),
  //         endDate: moment(value).endOf('day')
  //       }
  //     );
  //   }
  //
  //   // refresh list
  //   this.refreshCall();
  // }
  //
  // /**
  //  * Filter by relation
  //  */
  // protected filterByRelation(
  //   relation: string | string[]
  // ): RequestFilter {
  //   // make sure we always have an array of relations
  //   const relations: string[] = (_.isArray(relation) ?
  //     relation :
  //     [relation]
  //   ) as string[];
  //
  //   // go through all the relations until we get the desired query builder
  //   let relationQB: RequestQueryBuilder = this.queryBuilder;
  //   _.each(relations, (rel: string) => {
  //     relationQB = relationQB.include(rel).queryBuilder;
  //   });
  //
  //   // refresh list
  //   // this one isn't executed instantly, so there should be enough time to setup the relation filter
  //   this.refreshCall();
  //
  //   // retrieve filter
  //   return relationQB.filter;
  // }

  /**
   * Filter by
   */
  filterBy(data: {
    column: IExtendedColDef,
    valueOverwrite?: any
  }): void {
    // format
    const column: IExtendedColDef = data.column;

    // default query builder o which we apply the conditions
    let query: RequestQueryBuilder = this.queryBuilder;

    // apply to child query builder ?
    if (column.columnDefinition.filter.childQueryBuilder) {
      query = query.addChildQueryBuilder(column.columnDefinition.filter.childQueryBuilder);
    }

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
            query.filter.byText(
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
        // replace previous conditions
        query.filter.remove(column.columnDefinition.field);
        query.filter.removePathCondition(column.columnDefinition.field);
        query.filter.removePathCondition(`or.${column.columnDefinition.field}`);

        // do we need to retrieve empty
        const hasNoValueIncluded: boolean = column.columnDefinition.filter.value ?
          column.columnDefinition.filter.value.indexOf(AppFormSelectMultipleV2Component.HAS_NO_VALUE) > -1 :
          false;

        // has no value ?
        if (
          hasNoValueIncluded &&
          column.columnDefinition.filter.value.length === 1
        ) {
          // only has no value
          query.filter.where({
            or: [
              {
                [column.columnDefinition.field]: {
                  eq: null
                }
              }, {
                [column.columnDefinition.field]: {
                  exists: false
                }
              }
            ]
          }, true);
        } else if (
          hasNoValueIncluded
        ) {
          // has no value and others...
          query.filter.where({
            or: [
              {
                [column.columnDefinition.field]: {
                  eq: null
                }
              }, {
                [column.columnDefinition.field]: {
                  exists: false
                }
              }, {
                [column.columnDefinition.field]: { inq: column.columnDefinition.filter.value.filter((value) => value !== AppFormSelectMultipleV2Component.HAS_NO_VALUE) }
              }
            ]
          }, true);
        } else if (
          column.columnDefinition.filter.value &&
          column.columnDefinition.filter.value.length > 0
        ) {
          // only other values
          query.filter.where({
            [column.columnDefinition.field]: { inq: column.columnDefinition.filter.value.filter((value) => value !== AppFormSelectMultipleV2Component.HAS_NO_VALUE) }
          }, true);
        }

        // finished
        break;

      // date range
      case V2FilterType.DATE_RANGE:
        // filter
        query.filter.byDateRange(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // age range - years
      case V2FilterType.AGE_RANGE:
        // filter
        query.filter.byAgeRange(
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
        // remove the previous conditions
        query.filter.removePathCondition('address');
        query.filter.removePathCondition('addresses');
        query.filter.removePathCondition('and.address');
        query.filter.removePathCondition('and.addresses');

        // create a query builder
        const searchQb: RequestQueryBuilder = AddressModel.buildAddressFilter(
          column.columnDefinition.filter.field,
          column.columnDefinition.filter.fieldIsArray,
          column.columnDefinition.filter.address,
          column.columnDefinition.filter.address.filterLocationIds,
          (column.columnDefinition.filter as any).useLike
        );

        // add condition if we were able to create it
        if (
          searchQb &&
          !searchQb.isEmpty()
        ) {
          query.merge(searchQb);
        }

        // finished
        break;

      // boolean
      case V2FilterType.BOOLEAN:
        // filter
        query.filter.byBooleanUsingExist(
          column.columnDefinition.field,
          column.columnDefinition.filter.value as any
        );

        // finished
        break;

      // number range
      case V2FilterType.NUMBER_RANGE:
        // filter
        query.filter.byRange(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // deleted
      case V2FilterType.DELETED:
        // filter
        if (column.columnDefinition.filter.value === false) {
          query.excludeDeleted();
          query.filter.remove('deleted');
        } else {
          query.includeDeleted();
          if (column.columnDefinition.filter.value === true) {
            query.filter.where({
              deleted: {
                eq: true
              }
            }, true);
          } else {
            query.filter.remove('deleted');
          }
        }

        // finished
        break;

      // phone number
      case V2FilterType.PHONE_NUMBER:
        // filter
        query.filter.byPhoneNumber(
          column.columnDefinition.field,
          column.columnDefinition.filter.value
        );

        // finished
        break;

      // select group
      case V2FilterType.SELECT_GROUPS:
        // filter
        query.filter.bySelect(
          column.columnDefinition.field,
          data.valueOverwrite,
          true,
          null
        );

        // finished
        break;
    }

    // refresh list
    this.refreshCall();
  }
}
