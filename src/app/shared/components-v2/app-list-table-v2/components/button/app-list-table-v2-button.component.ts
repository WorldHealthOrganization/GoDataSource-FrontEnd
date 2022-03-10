import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from '@ag-grid-community/core';
import { IExtendedColDef } from '../../models/extended-column.model';
import { IV2ColumnButton } from '../../models/column.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-button',
  templateUrl: './app-list-table-v2-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2ButtonComponent implements ICellRendererAngularComp {
  // data
  data: any;

  // actions
  buttonColDef: IV2ColumnButton;

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(_params: ICellRendererParams): boolean {
    // ignore for now
    return true;
  }

  /**
   * After GUI attached
   */
  afterGuiAttached?(_params?: IAfterGuiAttachedParams): void {
    // ignore for now
  }

  /**
   * Cell initialized
   */
  agInit(params: ICellRendererParams): void {
    // retrieve extended column definition
    const extendedColDef: IExtendedColDef = params.colDef as IExtendedColDef;
    const buttonColumnDef: IV2ColumnButton = extendedColDef.columnDefinition as IV2ColumnButton;

    // set actions & data
    this.buttonColDef = buttonColumnDef;
    this.data = params.data;
  }
}
