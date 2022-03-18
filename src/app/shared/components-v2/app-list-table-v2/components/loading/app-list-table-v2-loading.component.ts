import { ILoadingOverlayAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ILoadingOverlayParams } from '@ag-grid-community/core';

/**
 * Loading element
 */
@Component({
  selector: 'app-list-table-v2-loading',
  templateUrl: 'app-list-table-v2-loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2LoadingComponent implements ILoadingOverlayAngularComp {
  /**
   * Loading init
   */
  agInit(_params: ILoadingOverlayParams): void {
    // ignore for now
  }
}
