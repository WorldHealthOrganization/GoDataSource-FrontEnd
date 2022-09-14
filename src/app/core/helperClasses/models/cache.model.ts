import { ISerializedQueryBuilder, RequestSortDirection } from '../request-query-builder';
import { SavedFilterData } from '../../models/saved-filters.model';

/**
 * Used by caching filter
 */
export interface ICachedSortItem {
  active: string;
  direction: RequestSortDirection;
}

/**
 * Used by caching filter
 */
export interface ICachedFilterItems {
  // keep the actual query executed to bring data
  queryBuilder: ISerializedQueryBuilder;

  // keep filters information
  inputs: {
    [inputName: string]: any
  };

  // keep sort information
  sort: ICachedSortItem;

  // side filters
  sideFilters: SavedFilterData;
}

/**
 * Used by caching filter
 */
export interface ICachedFilter {
  [filterKey: string]: ICachedFilterItems;
}

/**
 * Used by caching filter
 */
export interface ICachedInputsValues {
  [inputName: string]: any;
}
