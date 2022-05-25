import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-obfuscate',
  templateUrl: './app-list-table-v2-obfuscate.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2ObfuscateComponent implements ICellRendererAngularComp {
  // data
  value: string;
  notObfuscated: boolean;

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(params: ICellRendererParams): boolean {
    // update
    this.value = params.formatValue(params.getValue());

    // ignore for now
    return true;
  }

  /**
   * Cell initialized
   */
  agInit(params: ICellRendererParams): void {
    // update
    this.value = params.formatValue(params.getValue());
  }
}
