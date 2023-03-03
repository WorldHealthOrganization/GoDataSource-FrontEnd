import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { IHeaderParams } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-cell-basic-header',
  templateUrl: './app-spreadsheet-editor-v2-cell-basic-header.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-cell-basic-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2CellBasicHeaderComponent implements IHeaderAngularComp {
  // constants
  static readonly DEFAULT_COLUMN_ROW_NO: string = 'rowNo';

  // data
  label: string;
  colDef: IV2SpreadsheetEditorExtendedColDef;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(params: IHeaderParams): boolean {
    // finished
    this.update(params);
    return true;
  }

  /**
   * Cell initialized
   */
  agInit(params: IHeaderParams): void {
    this.update(params);
  }

  /**
   * Update info
   */
  private update(params: IHeaderParams): void {
    // data
    this.label = params.displayName;
    this.colDef = params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Header click
   */
  mouseUp(event: MouseEvent): void {
    // only primary button is relevant
    if (event.button !== 0) {
      return;
    }

    // trigger event
    this.colDef.editor.selection.headerMouseUp(
      this.colDef.field === AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO ?
        0 :
        this.colDef.editor.columnsMap[this.colDef.columnDefinition.field].index,
      event.ctrlKey,
      event.shiftKey
    );
  }
}
