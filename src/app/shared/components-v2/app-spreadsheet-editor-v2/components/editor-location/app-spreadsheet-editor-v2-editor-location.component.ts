import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { AppFormSelectLocationSingleV2Component } from '../../../../forms-v2/components/app-form-select-location-single-v2/app-form-select-location-single-v2.component';
import { ILocation } from '../../../../forms-v2/core/app-form-location-base-v2';
import { IV2SpreadsheetEditorExtendedColDef } from '../../models/extended-column.model';

@Component({
  selector: 'app-spreadsheet-editor-v2-editor-location',
  templateUrl: './app-spreadsheet-editor-v2-editor-location.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2-editor-location.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2EditorLocationComponent implements ICellEditorAngularComp {
  // input
  @ViewChild(AppFormSelectLocationSingleV2Component, { static: true }) private _input: AppFormSelectLocationSingleV2Component;

  // data
  private _params: ICellEditorParams;
  private _colDef: IV2SpreadsheetEditorExtendedColDef;
  value: string;

  /**
   * Component initialized
   */
  agInit(params: ICellEditorParams): void {
    // data
    this._params = params;
    this._colDef = this._params.column.getUserProvidedColDef() as IV2SpreadsheetEditorExtendedColDef;
    this.value = this._params.value;

    // already writing something, should we replace ?
    if (/^[0-9a-z]$/i.test(params.charPress)) {
      this._input.searchValue = params.charPress;
    }

    // focus and open
    this._input.open();
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

  /**
   * Location changed
   */
  selectedLocationChanged(location: ILocation): void {
    // nothing to attach ?
    if (!location) {
      return;
    }

    // attach location
    if (!this._colDef.editor.locationsMap) {
      this._colDef.editor.locationsMap = {
        [location.id]: location
      };
    } else if (!this._colDef.editor.locationsMap[location.id]) {
      this._colDef.editor.locationsMap[location.id] = location;
    }
  }
}
