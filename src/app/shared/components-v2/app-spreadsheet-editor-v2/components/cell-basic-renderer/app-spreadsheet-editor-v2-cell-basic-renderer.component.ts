import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';
import { V2SpreadsheetEditorColumnType } from '../../models/column.model';
import { AppFormDateV2Component } from '../../../../forms-v2/components/app-form-date-v2/app-form-date-v2.component';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-cell-basic-renderer',
  templateUrl: './app-spreadsheet-editor-v2-cell-basic-renderer.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-cell-basic-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2CellBasicRendererComponent implements ICellRendererAngularComp {
  // data
  id: string;
  fillId: string;
  params: ICellRendererParams;
  colDef: IV2SpreadsheetEditorExtendedColDef;

  // constants
  V2SpreadsheetEditorColumnType = V2SpreadsheetEditorColumnType;
  AppFormDateV2Component = AppFormDateV2Component;

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
    // - important to use getUserProvidedColDef to retrieve for location columns to work properly
    this.params = params;
    this.colDef = this.params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;

    // ids
    const columnIndex: number = this.colDef.editor.columnsMap[this.colDef.columnDefinition.field].index;
    this.id = `gd-spreadsheet-editor-v2-cell-basic-renderer-${this.params.rowIndex}-${columnIndex}`;
    this.fillId = `gd-spreadsheet-editor-v2-cell-basic-renderer-fill-${this.params.rowIndex}-${columnIndex}`;

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Start edit cell
   */
  startEditCell(key?: string): void {
    // nothing to do ?
    if (!this.params) {
      return;
    }

    // edit cell
    this.params.api.startEditingCell({
      rowIndex: this.params.rowIndex,
      colKey: this.colDef.columnDefinition.field,
      key
    });
  }

  /**
   * Mouse enter
   */
  mouseEnter(event: MouseEvent): void {
    this.colDef.editor.selection.cell.mouseEnter(
      this.params.rowIndex,
      this.colDef.editor.columnsMap[this.colDef.columnDefinition.field].index,
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
    this.colDef.editor.selection.cell.mouseDown(
      this.params.rowIndex,
      this.colDef.editor.columnsMap[this.colDef.columnDefinition.field].index,
      event.ctrlKey,
      event.shiftKey
    );
  }

  /**
   * Mouse up
   */
  mouseUp(): void {
    this.colDef.editor.selection.cell.mouseUp();
  }

  /**
   * Mouse leave
   */
  mouseLeave(): void {
    this.colDef.editor.selection.cell.mouseLeave();
  }

  /**
   * Fill mouse down
   */
  fillMouseDown(event: MouseEvent): void {
    // stop propagation
    event.stopPropagation();

    // trigger fill process
    this.colDef.editor.selection.cell.fill();
  }
}
