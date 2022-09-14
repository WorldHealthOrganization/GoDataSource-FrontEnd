import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V2ColumnExpandRowType } from '../../models/column.model';
import { IV2RowExpandRow } from '../../models/row.model';
import { ChangeValue } from '../../../app-changes-v2/models/change.model';

@Component({
  selector: 'app-list-table-v2-detail-row',
  templateUrl: 'app-list-table-v2-detail-row.component.html',
  styleUrls: ['./app-list-table-v2-detail-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2DetailRowComponent implements ICellRendererAngularComp {
  // data
  row: IV2RowExpandRow;

  // specific column types - V2ColumnExpandRowType.CHANGES
  changes: ChangeValue[];

  // constants
  V2ColumnExpandRowType = V2ColumnExpandRowType;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Initialize
   */
  agInit(params: ICellRendererParams): void {
    // update
    this.update(params);
  }

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(params: ICellRendererParams): boolean {
    // finished
    this.update(params);
    return true;
  }

  /**
   * Update info
   */
  private update(params: ICellRendererParams): void {
    // retrieve extended column definition
    this.row = params.data as IV2RowExpandRow;

    // custom processing
    switch (this.row?.column?.column?.type) {
      case V2ColumnExpandRowType.CHANGES:
        // convert model data to changes
        this.changes = this.row.column.column.changes(this.row.rowData);

        // finished
        break;
    }

    // update ui
    this.changeDetectorRef.detectChanges();
  }
}
