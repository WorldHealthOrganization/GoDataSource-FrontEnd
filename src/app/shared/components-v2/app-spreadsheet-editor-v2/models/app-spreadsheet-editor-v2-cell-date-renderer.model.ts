import { AppSpreadsheetEditorV2CellBasicRendererModel } from './app-spreadsheet-editor-v2-cell-basic-renderer.model';
import { AppFormDateV2Component } from '../../../forms-v2/components/app-form-date-v2/app-form-date-v2.component';

/**
 * Select date renderer
 */
export class AppSpreadsheetEditorV2CellDateRendererModel extends AppSpreadsheetEditorV2CellBasicRendererModel {
  // data
  private _guiRootValueHTMLValue: HTMLDivElement;
  private _guiRootValueHTMLIcon: HTMLDivElement;
  private _iconClick: () => void = () => {
    this.startEditCell(AppFormDateV2Component.ACTION_KEY_CALENDAR);
  };

  /**
   * Update value
   */
  protected updateValue(): void {
    // must initialize ?
    if (!this._guiRootValueHTMLValue) {
      // value
      this._guiRootValueHTMLValue = document.createElement('div');
      this._guiRootValueHTMLValue.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-value-text');
      this._guiRootValueHTML.appendChild(this._guiRootValueHTMLValue);

      // icon
      this._guiRootValueHTMLIcon = document.createElement('div');
      this._guiRootValueHTMLIcon.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-value-icon');
      this._guiRootValueHTMLIcon.innerHTML = '<span class="material-icons mat-icon">today</span>';
      this._guiRootValueHTMLIcon.addEventListener(
        'click',
        this._iconClick
      );
      this._guiRootValueHTML.appendChild(this._guiRootValueHTMLIcon);
    }

    // update text
    this._guiRootValueHTMLValue.innerHTML = this._colDef.editor.helpers.date(this._params.value);
  }

  /**
   * Destroy
   */
  destroy(): void {
    // parent
    super.destroy();

    // detach events
    this._guiRootValueHTMLIcon.removeEventListener(
      'click',
      this._iconClick
    );
  }
}
