import { RequestQueryBuilder } from './request-query-builder';
import { IExtendedColDef } from '../../shared/components-v2/app-list-table-v2/models/extended-column.model';
import { applyFilterBy, IV2Column } from '../../shared/components-v2/app-list-table-v2/models/column.model';

/**
 * Applied filters
 */
export abstract class ListQueryComponent {
  // table columns
  tableColumns: IV2Column[] = [];

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

  /**
   * Filter by
   */
  filterBy(data: {
    column: IExtendedColDef,
    valueOverwrite?: any
  }): void {
    // filter
    applyFilterBy(
      this.queryBuilder,
      data.column.columnDefinition,
      data.valueOverwrite
    );

    // refresh list
    this.refreshCall();
  }

  /**
   * Apply table column filters
   */
  protected applyTableColumnFilters(): void {
    // go through table column and apply filters
    (this.tableColumns || []).forEach((tableColumn) => {
      // has no filter ?
      if (!tableColumn.filter) {
        return;
      }

      // apply
      applyFilterBy(
        this.queryBuilder,
        tableColumn,
        undefined
      );
    });
  }
}
