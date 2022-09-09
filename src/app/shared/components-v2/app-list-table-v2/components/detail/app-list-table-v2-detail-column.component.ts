import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IExtendedColDef } from '../../models/extended-column.model';
import { IV2ColumnExpandRow, V2ColumnExpandRowType } from '../../models/column.model';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { IV2RowExpandRow } from '../../models/row.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-detail-column',
  templateUrl: './app-list-table-v2-detail-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2DetailColumnComponent implements ICellRendererAngularComp {
  // data
  data: any;
  dataNoOfChanges: {
    no: number
  } = {
      no: 0
    };
  expandRowColumnDef: IV2ColumnExpandRow;
  gridApi: GridApi;

  // details row
  detailsRow: IV2RowExpandRow;

  // constants
  V2ColumnExpandRowType = V2ColumnExpandRowType;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(params: ICellRendererParams): boolean {
    // finished
    this.update(params);
    return true;
  }

  /**
   * Cell initialized
   */
  agInit(params: ICellRendererParams): void {
    this.update(params);
  }

  /**
   * Update info
   */
  private update(params: ICellRendererParams): void {
    // retrieve extended column definition
    const extendedColDef: IExtendedColDef = params.colDef as IExtendedColDef;
    this.expandRowColumnDef = extendedColDef.columnDefinition as IV2ColumnExpandRow;
    this.data = params.data;
    this.dataNoOfChanges = {
      no: this.data && this.data[this.expandRowColumnDef.field] ?
        this.data[this.expandRowColumnDef.field].length :
        0
    };
    this.gridApi = params.api;
    this.detailsRow = this.gridApi.getRowNode((parseInt(params.node.id, 10) + 1).toString()).data as IV2RowExpandRow;

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Expand / Collapse details row
   * - & update what needs to be displayed in details row
   */
  expandCollapse(): void {
    // expand / collapse
    // & handle multiple expand columns that use the same details row
    if (this.detailsRow.column === this.expandRowColumnDef) {
      // expand / collapse
      this.detailsRow.visible = !this.detailsRow.visible;

      // update column that needs to be shown in expanded row details
      if (this.detailsRow.visible) {
        this.detailsRow.column = this.expandRowColumnDef;
        this.detailsRow.data = this.data;
      } else {
        this.detailsRow.column = null;
        this.detailsRow.data = undefined;
      }
    } else {
      // expand
      this.detailsRow.visible = true;
      this.detailsRow.column = this.expandRowColumnDef;
      this.detailsRow.data = this.data;
    }

    // filter rows - to display / hide our row
    this.gridApi.onFilterChanged();
  }
}
