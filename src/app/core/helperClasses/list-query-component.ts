import { RequestQueryBuilder } from './request-query-builder';
import { IExtendedColDef } from '../../shared/components-v2/app-list-table-v2/models/extended-column.model';
import { applyFilterBy, IV2Column, IV2ColumnAction } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { ListHelperService } from '../services/helper/list-helper.service';
import { IV2ColumnToVisibleMandatoryConf } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

/**
 * Applied filters
 */
export abstract class ListQueryComponent<T extends IV2Column> {
  // table columns
  private _tableColumns: T[] = [];
  get tableColumns(): T[] {
    return this._tableColumns;
  }
  set tableColumns(tableColumns: T[]) {
    // set value
    this._tableColumns = this.listHelperService.model.filterVisibleMandatoryTableColumns(tableColumns as unknown as IV2ColumnToVisibleMandatoryConf[]);

    // overwrite push items, otherwise we might push items that shouldn't be visible
    const self = this;
    this._tableColumns.push = function(...args) {
      return Array.prototype.push.apply(this, self.listHelperService.model.filterVisibleMandatoryTableColumns(args as unknown as IV2ColumnToVisibleMandatoryConf[]));
    };
  }

  // table columns actions
  tableColumnActions: IV2ColumnAction;

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
    protected listHelperService: ListHelperService,
    private queryBuilderChangedCallback: () => void,
    private refreshCall: (
      instant?: boolean,
      resetPagination?: boolean,
      triggeredByPageChange?: boolean
    ) => void
  ) {}

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
      data.column.columnDefinition as IV2Column,
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
