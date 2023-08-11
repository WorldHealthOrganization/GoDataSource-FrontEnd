import { V2Action } from './action.model';
import { V2Filter, IV2FilterDate, V2FilterType, V2FilterTextType } from './filter.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { AppFormSelectMultipleV2Component } from '../../../forms-v2/components/app-form-select-multiple-v2/app-form-select-multiple-v2.component';
import { AddressModel } from '../../../../core/models/address.model';
import * as _ from 'lodash';
import { ChangeValue } from '../../app-changes-v2/models/change.model';

/**
 * Column pinned
 */
export enum IV2ColumnPinned {
  LEFT = 'left',
  RIGHT = 'right'
}

/**
 * Format value
 */
export interface IV2ColumnBasicFormatType {
  // format
  type: string | ((item: any) => string);
}

/**
 * Format value
 */
export interface IV2ColumnBasicFormat extends IV2ColumnBasicFormatType {
  // optional
  field?: string;
  value?: (item: any) => any;
  obfuscated?: boolean;
}

/**
 * Basic column
 */
export interface IV2ColumnBasic {
  // required
  field: string;
  label: string;

  // optional
  format?: IV2ColumnBasicFormat;
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  width?: number;
  alwaysVisible?: boolean;
  centerHeader?: boolean;
  link?: (any) => string;
  cssCellClass?: string;
  sortable?: true | string;
  filter?: V2Filter;
  highlight?: string;
}

/**
 * Format
 */
export enum V2ColumnFormat {
  BUTTON,
  AGE,
  DATE,
  DATETIME,
  BOOLEAN,
  ACTIONS,
  STATUS,
  COLOR,
  ICON_URL,
  ICON_MATERIAL,
  LINK_LIST,
  HTML,
  EXPAND_ROW
}

/**
 * Expand row column type
 */
export enum V2ColumnExpandRowType {
  CHANGES
}

/**
 * Age column
 */
interface IV2ColumnAge extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.AGE
  };
}

/**
 * Date column
 */
interface IV2ColumnDate extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.DATE
  };

  // optional
  filter?: IV2FilterDate;
}

/**
 * Datetime column
 */
interface IV2ColumnDatetime extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.DATETIME
  };

  // optional
  // filter?: V2FilterDateTime;
}

/**
 * Boolean column
 */
interface IV2ColumnBoolean extends Omit<IV2ColumnBasic, 'format'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.BOOLEAN
  };
}

/**
 * Color column
 */
export interface IV2ColumnColor extends Omit<IV2ColumnBasic, 'format' | 'highlight'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.COLOR
  };
  noColorLabel: string;
}

/**
 * URL icon
 */
export interface IV2ColumnIconURL extends Omit<IV2ColumnBasic, 'format' | 'highlight'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.ICON_URL
  };
  noIconLabel: string;
}

/**
 * Material icon
 */
export interface IV2ColumnIconMaterial extends Omit<IV2ColumnBasic, 'format' | 'highlight'> {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.ICON_MATERIAL
  };
  noIconLabel: string;
}

/**
 * Button column
 */
export interface IV2ColumnButton {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.BUTTON
  };
  field: string;
  label: string;
  buttonLabel: (data: any) => string;
  color: 'text' | 'secondary' | 'primary' | 'warn' | 'accent' | undefined;
  click: (data: any) => void;

  // optional
  disabled?: (data: any) => boolean;
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  width?: number;
  alwaysVisible?: boolean;
  centerHeader?: boolean;
  cssCellClass?: string;
  sortable?: true | string;
  filter?: V2Filter;
}

/**
 * Action column
 */
export interface IV2ColumnAction {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.ACTIONS
  };
  actions: V2Action[];

  // never
  field?: never;
  filter?: never;
  sortable?: never;
  width?: never;
  alwaysVisible?: never;
  centerHeader?: never;
}

/**
 * Status column form type
 */
export enum IV2ColumnStatusFormType {
  EMPTY,
  CIRCLE,
  SQUARE,
  TRIANGLE,
  STAR,
  HEXAGON
}

/**
 * Status column form - shape
 */
interface IV2ColumnStatusFormShape {
  // required
  type: IV2ColumnStatusFormType.CIRCLE | IV2ColumnStatusFormType.SQUARE | IV2ColumnStatusFormType.TRIANGLE | IV2ColumnStatusFormType.STAR | IV2ColumnStatusFormType.HEXAGON;
  color: string;

  // optional
  tooltip?: string;
}

/**
 * Status column form - shape placeholder
 */
interface IV2ColumnStatusFormShapeEmpty {
  // required
  type: IV2ColumnStatusFormType.EMPTY;
}

/**
 * Status column form
 */
export type V2ColumnStatusForm = IV2ColumnStatusFormShapeEmpty | IV2ColumnStatusFormShape;

/**
 * Status column - legend
 */
interface IV2ColumnLegendStatusItem {
  // required
  form: IV2ColumnStatusFormShape;
  label: string;
  order: number | undefined;
}

/**
 * Status column - legend
 */
interface IV2ColumnLegend<T> {
  // required
  title: string;
  items: T[];
}

/**
 * Status column
 */
export interface IV2ColumnStatus {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.STATUS
  };
  notResizable: true;
  field: string;
  label: string;
  forms: (IV2ColumnStatus, data: any) => V2ColumnStatusForm[];
  legends: IV2ColumnLegend<IV2ColumnLegendStatusItem>[];

  // optional
  notVisible?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  cssCellClass?: string;

  // never
  width?: never;
  alwaysVisible?: never;
  centerHeader?: never;
  sortable?: never;
  filter?: never;
}

/**
 * Link list column
 */
export interface IV2ColumnLinkList {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.LINK_LIST
  };
  field: string;
  label: string;
  links: (data: any) => {
    label: string,
    href: string
  }[];

  // optional
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  width?: number;
  alwaysVisible?: boolean;
  centerHeader?: boolean;
  cssCellClass?: string;
  filter?: V2Filter;

  // never
  sortable?: never;
}

/**
 * HTML column
 */
export interface IV2ColumnHTML {
  // required
  format: Omit<IV2ColumnBasicFormatType, 'type'> & {
    type: V2ColumnFormat.HTML
  };
  field: string;
  label: string;
  html: (data: any, column: IV2ColumnHTML) => string;

  // optional
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  width?: number;
  alwaysVisible?: boolean;
  centerHeader?: boolean;
  cssCellClass?: string;
  filter?: V2Filter;

  // never
  sortable?: never;
}

/**
 * Expand row - column of type changes
 */
export interface IV2ColumnExpandRowChanges {
  // required
  type: V2ColumnExpandRowType.CHANGES;
  changes: (data: any) => ChangeValue[];
}

/**
 * Expand row column types
 */
export type IV2ColumnExpandRowTypes = IV2ColumnExpandRowChanges;

/**
 * Expand row column
 */
export interface IV2ColumnExpandRow {
  // required
  format: Omit<IV2ColumnBasicFormat, 'type'> & {
    type: V2ColumnFormat.EXPAND_ROW
  };
  field: string;
  label: string;
  column: IV2ColumnExpandRowTypes;

  // optional
  notVisible?: boolean;
  exclude?: (IV2Column) => boolean;
  pinned?: IV2ColumnPinned | boolean;
  notResizable?: boolean;
  notMovable?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  width?: number;
  alwaysVisible?: boolean;
  centerHeader?: boolean;
  cssCellClass?: string;
  sortable?: true | string;
  filter?: V2Filter;
}

/**
 * Column
 */
export type IV2Column = IV2ColumnBasic | IV2ColumnButton | IV2ColumnAge | IV2ColumnDate | IV2ColumnDatetime | IV2ColumnBoolean | IV2ColumnColor
| IV2ColumnIconURL | IV2ColumnIconMaterial | IV2ColumnStatus | IV2ColumnLinkList | IV2ColumnHTML | IV2ColumnExpandRow;

/**
 * Filter handler
 */
export const applyFilterBy = (
  query: RequestQueryBuilder,
  column: IV2Column,
  valueOverwrite?: any
): void => {
  // apply to child query builder ?
  if (column.filter.childQueryBuilderKey) {
    query = query.addChildQueryBuilder(column.filter.childQueryBuilderKey);
  }

  // apply to relationship ?
  if (column.filter.relationshipKey) {
    query = query.include(column.filter.relationshipKey).queryBuilder;
  }

  // custom filter ?
  if (column.filter.search) {
    // call
    column.filter.search(column);

    // finished
    return;
  }

  // filter accordingly
  switch (column.filter.type) {
    // text
    case V2FilterType.TEXT:

      // text filter type
      switch (column.filter.textType) {
        case V2FilterTextType.STARTS_WITH:

          // filter
          query.filter.byText(
            column.field,
            column.filter.value,
            true,
            column.filter.useLike
          );

          // finished
          break;
      }

      // finished
      break;

    // multiple select
    case V2FilterType.MULTIPLE_SELECT:
      // replace previous conditions
      query.filter.remove(column.field);
      query.filter.removePathCondition(column.field);
      query.filter.removePathCondition(`or.${column.field}`);

      // do we need to retrieve empty
      const hasNoValueIncluded: boolean = column.filter.value ?
        column.filter.value.indexOf(AppFormSelectMultipleV2Component.HAS_NO_VALUE) > -1 :
        false;

      // has no value ?
      if (
        hasNoValueIncluded &&
        column.filter.value.length === 1
      ) {
        // only has no value
        query.filter.where({
          or: [
            {
              [column.field]: {
                eq: null
              }
            }, {
              [column.field]: {
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
              [column.field]: {
                eq: null
              }
            }, {
              [column.field]: {
                exists: false
              }
            }, {
              [column.field]: { inq: column.filter.value.filter((value) => value !== AppFormSelectMultipleV2Component.HAS_NO_VALUE) }
            }
          ]
        }, true);
      } else if (
        column.filter.value &&
        column.filter.value.length > 0
      ) {
        // only other values
        query.filter.where({
          [column.field]: { inq: column.filter.value.filter((value) => value !== AppFormSelectMultipleV2Component.HAS_NO_VALUE) }
        }, true);
      }

      // finished
      break;

    // multiple select
    case V2FilterType.MULTIPLE_LOCATION:
      // filter
      query.filter.bySelect(
        column.filter.field,
        column.filter.value,
        true,
        null
      );

      // finished
      break;

    // date range
    case V2FilterType.DATE_RANGE:
      // filter
      query.filter.byDateRange(
        column.field,
        column.filter.value
      );

      // finished
      break;

    // age range - years
    case V2FilterType.AGE_RANGE:
      // filter
      query.filter.byAgeRange(
        column.field,
        column.filter.value
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
        column.filter.field,
        column.filter.fieldIsArray,
        column.filter.address,
        column.filter.address.filterLocationIds,
        (column.filter as any).useLike
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
        column.field,
        column.filter.value as any
      );

      // finished
      break;

    // number range
    case V2FilterType.NUMBER_RANGE:
      // filter
      query.filter.byRange(
        column.field,
        column.filter.value
      );

      // finished
      break;

    // deleted
    case V2FilterType.DELETED:
      // filter
      if (column.filter.value === false) {
        query.excludeDeleted();
        query.filter.remove('deleted');
      } else {
        query.includeDeleted();
        if (column.filter.value === true) {
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
        column.field,
        column.filter.value
      );

      // finished
      break;

    // select group
    case V2FilterType.SELECT_GROUPS:
      // filter
      query.filter.bySelect(
        column.field,
        valueOverwrite ?
          valueOverwrite :
          [],
        true,
        null
      );

      // finished
      break;
  }
};

/**
 * Reset filters to default values
 */
export const applyResetOnAllFilters = (
  columns: IV2Column[]
): void => {
  // clear header filters
  (columns || []).forEach((column) => {
    // doesn't have filter, then there is no point in continuing ?
    if (!column.filter) {
      return;
    }

    // reset value
    switch (column.filter.type) {
      case V2FilterType.ADDRESS_PHONE_NUMBER:
        column.filter.address.phoneNumber = column.filter.defaultValue;

        // finished
        break;

      case V2FilterType.ADDRESS_MULTIPLE_LOCATION:
        column.filter.address.filterLocationIds = column.filter.defaultValue;

        // finished
        break;

      case V2FilterType.ADDRESS_FIELD:
        column.filter.address[column.filter.addressField] = column.filter.defaultValue;

        // finished
        break;

      case V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION:
        column.filter.address.geoLocationAccurate = column.filter.defaultValue as any;

        // finished
        break;

      default:
        column.filter.value =  column.filter.defaultValue && typeof column.filter.defaultValue === 'object' ?
          _.cloneDeep(column.filter.defaultValue) :
          column.filter.defaultValue;
    }

    // custom filter ?
    if (column.filter.search) {
      // call
      column.filter.search(column);
    }
  });
};

/**
 * Sort by
 */
export const applySortBy = (
  tableSortBy: {
    field?: string,
    direction?: RequestSortDirection
  },
  applyToQueryBuilder: RequestQueryBuilder,
  advancedQueryBuilder: RequestQueryBuilder,
  objectDetailsSort: {
    [property: string]: string[]
  }
): void => {
  // remove previous sort columns, we can sort only by one column at a time
  applyToQueryBuilder.sort.clear();

  // retrieve Side filters
  if (advancedQueryBuilder) {
    applyToQueryBuilder.sort.merge(advancedQueryBuilder.sort);
  }

  // sort
  if (
    tableSortBy.field &&
    tableSortBy.direction
  ) {
    // add sorting criteria
    if (
      objectDetailsSort &&
      objectDetailsSort[tableSortBy.field]
    ) {
      _.each(objectDetailsSort[tableSortBy.field], (childProperty: string) => {
        applyToQueryBuilder.sort.by(
          `${tableSortBy.field}.${childProperty}`,
          tableSortBy.direction
        );
      });
    } else {
      applyToQueryBuilder.sort.by(
        tableSortBy.field,
        tableSortBy.direction
      );
    }
  }
};
