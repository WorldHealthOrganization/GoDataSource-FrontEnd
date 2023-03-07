import { INoRowsOverlayAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ILoadingOverlayParams } from '@ag-grid-community/core';

/**
 * Loading element
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-no-data',
  templateUrl: 'app-spreadsheet-editor-v2-no-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2NoDataComponent implements INoRowsOverlayAngularComp {
  /**
   * Loading init
   */
  agInit(_params: ILoadingOverlayParams): void {
    // ignore for now
  }
}
