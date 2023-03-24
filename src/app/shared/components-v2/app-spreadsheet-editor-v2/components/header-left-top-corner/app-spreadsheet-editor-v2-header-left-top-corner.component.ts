import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { IHeaderParams } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-header-left-top-corner',
  templateUrl: './app-spreadsheet-editor-v2-header-left-top-corner.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-header-left-top-corner.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2HeaderLeftTopCornerComponent implements IHeaderAngularComp, OnDestroy {
  // constants
  static readonly DEFAULT_COLUMN_ROW_NO: string = 'rowNo';
  static readonly DEFAULT_COLUMN_ROW_NO_WIDTH: number = 50;

  // data
  colDef: IV2SpreadsheetEditorExtendedColDef;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // reset
    this.colDef.editor.refreshErrorRowsCell = undefined;
  }

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
    this.colDef = params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;

    // update cell on changes
    this.colDef.editor.refreshErrorRowsCell = () => {
      this.changeDetectorRef.detectChanges();
    };

    // update ui
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Mouse enter
   */
  mouseEnter(event: MouseEvent): void {
    this.colDef.editor.selection.header.top.mouseEnter(
      0,
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
      0,
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

  /**
   * Mouse move
   */
  mouseMove(event: MouseEvent): void {
    this.colDef.editor.selection.header.top.mouseMove(
      true,
      event
    );
  }
}
