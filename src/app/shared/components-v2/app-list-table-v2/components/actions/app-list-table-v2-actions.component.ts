import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { IAfterGuiAttachedParams, ICellRendererParams } from '@ag-grid-community/core';
import { IExtendedColDef } from '../../models/extended-column.model';
import { IV2ColumnAction } from '../../models/column.model';
import { V2RowAction, V2RowActionType } from '../../models/action.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-actions',
  templateUrl: './app-list-table-v2-actions.component.html',
  styleUrls: ['./app-list-table-v2-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2ActionsComponent implements ICellRendererAngularComp {
  // data
  data: any;

  // actions
  actions: V2RowAction[];

  // constants
  V2RowActionType = V2RowActionType;

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
    const actionColumnDef: IV2ColumnAction = extendedColDef.columnDefinition as IV2ColumnAction;

    // set actions & data
    this.actions = actionColumnDef.actions;
    this.data = params.data;
  }
}
