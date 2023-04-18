import { ICellRendererComp, ICellRendererParams } from '@ag-grid-community/core';
import { IV2SpreadsheetEditorExtendedColDef } from './extended-column.model';

/**
 * Basic cell renderer (text...)
 */
export class AppSpreadsheetEditorV2CellBasicRendererModel implements ICellRendererComp {
  // gui
  private _guiRoot: HTMLDivElement;
  protected _guiRootValueHTML: HTMLDivElement;
  protected _guiRootFill: HTMLDivElement;

  // data
  protected _params: ICellRendererParams;
  protected _colDef: IV2SpreadsheetEditorExtendedColDef;

  // events
  private _contextMenu: (event: PointerEvent) => boolean = (event) => {
    // stop
    event.preventDefault();

    // show context menu
    this._colDef.editor.helpers.openMenu(event);

    // finish
    return false;
  };
  private _mouseEnter: (event: MouseEvent) => void = (event) => {
    this._colDef.editor.selection.cell.mouseEnter(
      this._params.rowIndex,
      this._colDef.editor.columnsMap[this._colDef.columnDefinition.field].index,
      event.buttons === 1
    );
  };
  private _mouseDown: (event: MouseEvent) => void = (event) => {
    // only primary button is relevant
    if (event.buttons !== 1) {
      return;
    }

    // execute mouse down
    this._colDef.editor.selection.cell.mouseDown(
      this._params.rowIndex,
      this._colDef.editor.columnsMap[this._colDef.columnDefinition.field].index,
      event.ctrlKey,
      event.shiftKey
    );
  };
  private _mouseUp: () => void = () => {
    this._colDef.editor.selection.cell.mouseUp();
  };
  private _mouseLeave: () => void = () => {
    this._colDef.editor.selection.cell.mouseLeave();
  };
  private _mouseMove: (event: MouseEvent) => void = (event) => {
    this._colDef.editor.selection.cell.mouseMove(event);
  };
  private _fillMouseMove: (event: MouseEvent) => void = (event) => {
    // stop propagation
    event.stopPropagation();

    // trigger fill process
    this._colDef.editor.selection.cell.fill();
  };

  /**
   * Initialize
   */
  init(params): void {
    // initialize root
    this._guiRoot = document.createElement('div');

    // fill
    this._guiRootFill = document.createElement('div');

    // data
    this.updateParams(params);

    // attach classes
    this._guiRoot.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer');
    this._guiRootFill.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-fill');

    // create child value
    const guiRootValue = document.createElement('div');
    this._guiRootValueHTML = document.createElement('div');

    // attach css
    guiRootValue.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-value');

    // append child
    guiRootValue.appendChild(this._guiRootValueHTML);
    this._guiRoot.appendChild(guiRootValue);
    this._guiRoot.appendChild(this._guiRootFill);

    // attach events
    this._guiRoot.addEventListener(
      'contextmenu',
      this._contextMenu
    );
    this._guiRoot.addEventListener(
      'mouseenter',
      this._mouseEnter
    );
    this._guiRoot.addEventListener(
      'mousedown',
      this._mouseDown
    );
    this._guiRoot.addEventListener(
      'mouseup',
      this._mouseUp
    );
    this._guiRoot.addEventListener(
      'mouseleave',
      this._mouseLeave
    );
    this._guiRoot.addEventListener(
      'mousemove',
      this._mouseMove
    );
    this._guiRootFill.addEventListener(
      'mousedown',
      this._fillMouseMove
    );

    // update value
    this.updateValue();
  }

  /**
   * Destroy
   */
  destroy(): void {
    // detach events
    this._guiRoot.removeEventListener(
      'contextmenu',
      this._contextMenu
    );
    this._guiRoot.removeEventListener(
      'mouseenter',
      this._mouseEnter
    );
    this._guiRoot.removeEventListener(
      'mousedown',
      this._mouseDown
    );
    this._guiRoot.removeEventListener(
      'mouseup',
      this._mouseUp
    );
    this._guiRoot.removeEventListener(
      'mouseleave',
      this._mouseLeave
    );
    this._guiRoot.removeEventListener(
      'mousemove',
      this._mouseMove
    );
    this._guiRootFill.removeEventListener(
      'mousedown',
      this._fillMouseMove
    );
  }

  /**
   * Update
   */
  refresh(params): boolean {
    // data
    this.updateParams(params);

    // update value
    this.updateValue();

    // refreshed successfully
    return true;
  }

  /**
   * Retrieve gui
   */
  getGui(): HTMLDivElement {
    return this._guiRoot;
  }

  /**
   * Update params
   */
  private updateParams(params): void {
    // data
    this._params = params;
    this._colDef = this._params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;

    // attach / update id
    this.checkAndUpdateIDs();
  }

  /**
   * Check and update id
   */
  private checkAndUpdateIDs(): void {
    // root id
    const columnIndex = this._colDef.editor.columnsMap[this._colDef.columnDefinition.field].index;
    let id = `gd-spreadsheet-editor-v2-cell-basic-renderer-${this._params.rowIndex}-${columnIndex}`;
    if (this._guiRoot.id !== id) {
      this._guiRoot.id = id;
    }

    // fill id
    id = `gd-spreadsheet-editor-v2-cell-basic-renderer-fill-${this._params.rowIndex}-${columnIndex}`;
    if (this._guiRootFill.id !== id) {
      this._guiRootFill.id = id;
    }
  }

  /**
   * Update value
   */
  protected updateValue(): void {
    this._guiRootValueHTML.innerHTML = this._params.value || this._params.value === 0 ?
      this._params.value :
      '';
  }

  /**
   * Start edit cell
   */
  protected startEditCell(key?: string): void {
    // nothing to do ?
    if (!this._params) {
      return;
    }

    // edit cell
    this._params.api.startEditingCell({
      rowIndex: this._params.rowIndex,
      colKey: this._colDef.columnDefinition.field,
      key
    });
  }
}
