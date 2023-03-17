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
  id: string;
  label: string;
  colDef: IV2SpreadsheetEditorExtendedColDef;
  columnIndex: number;

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
    this.columnIndex = this.colDef.field === AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO ?
      0 :
      this.colDef.editor.columnsMap[this.colDef.columnDefinition.field].index;
    this.id = `gd-spreadsheet-editor-v2-cell-basic-header-${this.columnIndex}`;

    // first cell ?
    if (this.columnIndex === 0) {
      this.colDef.editor.refreshErrorRowsCell = () => {
        this.changeDetectorRef.detectChanges();
      };
    }

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Mouse enter
   */
  mouseEnter(event: MouseEvent): void {
    this.colDef.editor.selection.header.top.mouseEnter(
      this.columnIndex,
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
    this.colDef.editor.selection.header.top.mouseDown(
      this.columnIndex,
      event.ctrlKey,
      event.shiftKey
    );
  }

  /**
   * Mouse up
   */
  mouseUp(): void {
    this.colDef.editor.selection.header.top.mouseUp();
  }

  /**
   * Mouse leave
   */
  mouseLeave(): void {
    this.colDef.editor.selection.header.top.mouseLeave();
  }
}
