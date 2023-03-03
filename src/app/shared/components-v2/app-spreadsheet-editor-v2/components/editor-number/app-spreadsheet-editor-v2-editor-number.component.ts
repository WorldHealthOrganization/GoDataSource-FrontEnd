import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { AppFormNumberV2Component } from '../../../../forms-v2/components/app-form-number-v2/app-form-number-v2.component';

@Component({
  selector: 'app-spreadsheet-editor-v2-editor-number',
  templateUrl: './app-spreadsheet-editor-v2-editor-number.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2EditorNumberComponent implements ICellEditorAngularComp {
  // input
  @ViewChild(AppFormNumberV2Component, { static: true }) private _input: AppFormNumberV2Component;

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

    // focus
    this._input.focus();

    // already writing something, should we replace ?
    if (/^[0-9]$/.test(params.charPress)) {
      this.value = params.charPress;
    }
  }

  /**
   * Finished editing
   */
  getValue(): string {
    return this.value;
  }
}
