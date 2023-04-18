import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { AppFormDateV2Component } from '../../../../forms-v2/components/app-form-date-v2/app-form-date-v2.component';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';
import { Moment } from 'moment';
import { IV2SpreadsheetEditorColumnValidatorDate } from '../../models/column.model';

@Component({
  selector: 'app-spreadsheet-editor-v2-editor-date',
  templateUrl: './app-spreadsheet-editor-v2-editor-date.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-editor-date.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2EditorDateComponent implements ICellEditorAngularComp {
  // input
  @ViewChild(AppFormDateV2Component, { static: true }) private _input: AppFormDateV2Component;

  // data
  private _params: ICellEditorParams;
  value: string;
  minDate: undefined | Moment;
  maxDate: undefined | Moment;

  /**
   * Component initialized
   */
  agInit(params: ICellEditorParams): void {
    // data
    this._params = params;
    this.value = this._params.value;

    // determine min & max date if we have any
    const colDef = this._params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;
    const dateConf = colDef.columnDefinition?.validators as IV2SpreadsheetEditorColumnValidatorDate;
    if (dateConf?.date) {
      this.minDate = dateConf.date(params.data).min;
      this.maxDate = dateConf.date(params.data).max;
    }

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
