import { ILoadingOverlayAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ILoadingOverlayParams } from '@ag-grid-community/core';

/**
 * Loading element
 */
@Component({
  selector: 'app-spreadsheet-editor-v2-loading',
  templateUrl: 'app-spreadsheet-editor-v2-loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2LoadingComponent implements ILoadingOverlayAngularComp {
  /**
   * Loading init
   */
  agInit(_params: ILoadingOverlayParams): void {
    // ignore for now
  }
}
