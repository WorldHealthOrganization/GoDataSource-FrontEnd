import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

/**
 * Refresh item data
 */
export interface ICreateViewModifyV2Refresh {
  // required
  queryBuilder: RequestQueryBuilder;
  searchBy: string;
}
