import { AppSpreadsheetEditorV2CellBasicRendererModel } from './app-spreadsheet-editor-v2-cell-basic-renderer.model';

/**
 * Select cell renderer
 */
export class AppSpreadsheetEditorV2CellSelectRendererModel extends AppSpreadsheetEditorV2CellBasicRendererModel {
  // data
  private _guiRootValueHTMLValue: HTMLDivElement;
  private _guiRootValueHTMLIcon: HTMLDivElement;
  private _iconClick: () => void = () => {
    this.startEditCell();
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
      this._guiRootValueHTMLIcon.innerHTML = '<span class="material-icons mat-icon">unfold_more</span>';
      this._guiRootValueHTMLIcon.addEventListener(
        'click',
        this._iconClick
      );
      this._guiRootValueHTML.appendChild(this._guiRootValueHTMLIcon);
    }

    // update text
    this._guiRootValueHTMLValue.innerHTML = '';

    // icon
    if (
      this._params.value !== undefined &&
      this._params.value !== null &&
      this._colDef.columnDefinition.optionsMap[this._params.value]?.icon
    ) {
      this._guiRootValueHTMLValue.innerHTML += `<span class="material-icons mat-icon">${this._colDef.columnDefinition.optionsMap[this._params.value].icon}</span>`;
    }

    // icon url
    if (
      this._params.value !== undefined &&
      this._params.value !== null &&
      this._colDef.columnDefinition.optionsMap[this._params.value]?.iconUrl
    ) {
      this._guiRootValueHTMLValue.innerHTML += `<img src="${this._colDef.columnDefinition.optionsMap[this._params.value].iconUrl}" />`;
    }

    // label
    this._guiRootValueHTMLValue.innerHTML += this._params.value !== undefined && this._params.value !== null && this._colDef.columnDefinition.optionsMap[this._params.value] ?
      (
        this._colDef.columnDefinition.optionsMap[this._params.value].label ?
          this._colDef.editor.helpers.translate(this._colDef.columnDefinition.optionsMap[this._params.value].label) :
          ''
      ) : (
        this._params.value || this._params.value === 0 ?
          this._params.value :
          ''
      );
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
