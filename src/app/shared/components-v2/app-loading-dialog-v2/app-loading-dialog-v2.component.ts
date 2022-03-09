import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IV2LoadingDialogData } from './models/loading-dialog-v2.model';

@Component({
  selector: 'app-loading-dialog-v2',
  templateUrl: './app-loading-dialog-v2.component.html',
  styleUrls: ['./app-loading-dialog-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLoadingDialogV2Component {
  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: IV2LoadingDialogData
  ) {}

  /**
   * Detect changes
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }
}
