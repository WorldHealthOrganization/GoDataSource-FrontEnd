import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IExtendedColDef } from '../../models/extended-column.model';
import { IV2ColumnAction } from '../../models/column.model';
import { V2Action, V2ActionType } from '../../models/action.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-actions',
  templateUrl: './app-list-table-v2-actions.component.html',
  styleUrls: ['./app-list-table-v2-actions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2ActionsComponent implements ICellRendererAngularComp {
  // data
  data: any;

  // actions
  actions: V2Action[];

  // constants
  V2ActionType = V2ActionType;

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(_params: ICellRendererParams): boolean {
    // ignore for now
    return true;
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

  /**
   * Check if at least one child visible
   */
  checkIfAtLeastOneChildVisible(action: V2Action): boolean {
    // no children ?
    if (action.type !== V2ActionType.MENU) {
      return true;
    }

    // no children ?
    if (!action.menuOptions?.length) {
      return false;
    }

    // at least one child visible ?
    for (let menuOptionIndex = 0; menuOptionIndex < action.menuOptions.length; menuOptionIndex++) {
      // visible ?
      if (
        !action.menuOptions[menuOptionIndex].visible ||
        action.menuOptions[menuOptionIndex].visible(this.data)
      ) {
        return true;
      }
    }

    // no child visible
    return false;
  }
}
