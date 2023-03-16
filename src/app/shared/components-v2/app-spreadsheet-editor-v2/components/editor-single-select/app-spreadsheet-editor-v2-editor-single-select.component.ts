import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { AppFormSelectSingleV2Component } from '../../../../forms-v2/components/app-form-select-single-v2/app-form-select-single-v2.component';
import { ILabelValuePairModel } from '../../../../forms-v2/core/label-value-pair.model';
import { IV2SpreadsheetEditorColumnSingleSelect } from '../../models/column.model';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';

@Component({
  selector: 'app-spreadsheet-editor-v2-editor-single-select',
  templateUrl: './app-spreadsheet-editor-v2-editor-single-select.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-editor-single-select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2EditorSingleSelectComponent implements ICellEditorAngularComp {
  // input
  @ViewChild(AppFormSelectSingleV2Component, { static: true }) private _input: AppFormSelectSingleV2Component;

  // data
  private _params: ICellEditorParams;
  options: ILabelValuePairModel[];
  value: string;

  /**
   * Component initialized
   */
  agInit(params: ICellEditorParams): void {
    // data
    this._params = params;
    this.options = ((this._params.colDef as IV2SpreadsheetEditorExtendedColDef).columnDefinition as IV2SpreadsheetEditorColumnSingleSelect).options;
    this.value = this._params.value;

    // start with search value ?
    if (/^[0-9a-z]$/i.test(params.charPress)) {
      this._input.open(params.charPress);
    } else {
      // focus and open
      this._input.open();
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
