import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IV2LoadingDialogData } from './models/loading-dialog-v2.model';
import { Location } from '@angular/common';
import { SubscriptionLike } from 'rxjs/internal/types';

@Component({
  selector: 'app-loading-dialog-v2',
  templateUrl: './app-loading-dialog-v2.component.html',
  styleUrls: ['./app-loading-dialog-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLoadingDialogV2Component implements OnDestroy {
  // subscriptions
  locationSubscription: SubscriptionLike;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    location: Location,
    dialogRef: MatDialogRef<AppLoadingDialogV2Component>,
    @Inject(MAT_DIALOG_DATA) public data: IV2LoadingDialogData
  ) {
    // location subscription
    this.locationSubscription = location.subscribe(() => {
      // close
      dialogRef.close();

      // update ui
      changeDetectorRef.detectChanges();
    });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release location subscription
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = undefined;
    }
  }

  /**
   * Detect changes
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }
}
