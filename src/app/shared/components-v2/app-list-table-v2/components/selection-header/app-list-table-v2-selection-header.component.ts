import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { IAfterGuiAttachedParams, IHeaderParams } from '@ag-grid-community/core';
import { IV2ColumnAction } from '../../models/column.model';
import { IExtendedColDef } from '../../models/extended-column.model';
import { IV2ActionMenuIcon } from '../../models/action.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-selection-header',
  templateUrl: './app-list-table-v2-selection-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2SelectionHeaderComponent implements IHeaderAngularComp {
  // menu
  action: IV2ActionMenuIcon;

  // selected records
  component: {
    selectedRows: number
  };

  /**
   * Constructor
   */
  constructor(
    public changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(params: IHeaderParams): boolean {
    // reload
    this.reload(params);

    // redraw
    this.changeDetectorRef.detectChanges();

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
  agInit(params: IHeaderParams): void {
    // retrieve extended column definition
    this.reload(params);
  }

  /**
   * Reload data
   */
  reload(params: IHeaderParams): void {
    // retrieve extended column definition
    const extendedColDef: IExtendedColDef = params.column.getUserProvidedColDef() as IExtendedColDef;
    this.component = extendedColDef.columnDefinitionData;
    this.action = (extendedColDef.columnDefinition as IV2ColumnAction).actions[0] as IV2ActionMenuIcon;
  }
}
