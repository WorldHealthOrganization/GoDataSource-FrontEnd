import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';
import { CreateViewModifyV2Action } from '../../../app-create-view-modify-v2/models/action.model';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-cell-row-no-renderer',
  templateUrl: './app-spreadsheet-editor-v2-cell-row-no-renderer.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-cell-row-no-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2CellRowNoRendererComponent implements ICellRendererAngularComp {
  // data
  id: string;
  selectedId: string;
  rowNo: number;
  params: ICellRendererParams;
  colDef: IV2SpreadsheetEditorExtendedColDef;

  // constants
  CreateViewModifyV2Action = CreateViewModifyV2Action;

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
    // data
    this.rowNo = params.rowIndex + 1;
    this.params = params;
    this.id = `gd-spreadsheet-editor-v2-cell-row-no-renderer-${this.params.rowIndex}`;
    this.selectedId = `gd-spreadsheet-editor-v2-cell-row-no-renderer-selected-${this.params.rowIndex}`;
    this.colDef = this.params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Mouse enter
   */
  mouseEnter(event: MouseEvent): void {
    this.colDef.editor.selection.header.left.mouseEnter(
      this.params.rowIndex,
      event.buttons === 1
    );
  }

  /**
   * Mouse down
   */
  mouseDown(event: MouseEvent): void {
    // only primary button is relevant
    if (event.buttons !== 1) {
      return;
    }

    // execute mouse down
    this.colDef.editor.selection.header.left.mouseDown(
      this.params.rowIndex,
      event.ctrlKey,
      event.shiftKey
    );
  }

  /**
   * Mouse up
   */
  mouseUp(): void {
    this.colDef.editor.selection.header.left.mouseUp();
  }

  /**
   * Mouse leave
   */
  mouseLeave(): void {
    this.colDef.editor.selection.header.left.mouseLeave();
  }
}
