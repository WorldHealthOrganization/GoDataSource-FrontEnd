import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { AppFormDateV2Component } from '../../../../forms-v2/components/app-form-date-v2/app-form-date-v2.component';

@Component({
  selector: 'app-spreadsheet-editor-v2-editor-date',
  templateUrl: './app-spreadsheet-editor-v2-editor-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2EditorDateComponent implements ICellEditorAngularComp {
  // input
  @ViewChild(AppFormDateV2Component, { static: true }) private _input: AppFormDateV2Component;

  // data
  private _params: ICellEditorParams;
  value: string;

  /**
   * Component initialized
   */
  agInit(params: ICellEditorParams): void {
    // data
    this._params = params;
    this.value = this._params.value;

    // focus / open
    if (params.eventKey === AppFormDateV2Component.ACTION_KEY_CALENDAR) {
      this._input.open();
    } else {
      // focus
      this._input.focus();

      // already writing something, should we replace ?
      if (/^[0-9]$/.test(params.charPress)) {
        this.value = params.charPress;
        this._input.setStartingValue(this.value);
      }
    }
  }

  /**
   * Finished editing
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Closed
   */
  stopEditing(): void {
    this._params.stopEditing();
  }
}
