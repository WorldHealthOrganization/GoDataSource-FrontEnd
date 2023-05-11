import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { IV2Breadcrumb } from './models/breadcrumb.model';

/**
 * Component
 */
@Component({
  selector: 'app-breadcrumb-v2',
  templateUrl: './app-breadcrumb-v2.component.html',
  styleUrls: ['./app-breadcrumb-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBreadcrumbV2Component implements OnDestroy {
  // timers
  private _detectChangesTimer: number;

  // breadcrumbs
  private _breadcrumbs: IV2Breadcrumb[];
  @Input() set breadcrumbs(breadcrumbs: IV2Breadcrumb[]) {
    // set data
    this._breadcrumbs = breadcrumbs;

    // don't update on null values
    if (!this._breadcrumbs) {
      return;
    }

    // stop previous
    this.stopDetectChangesTimer();

    // wait for html to be updated
    this._detectChangesTimer = setTimeout(() => {
      // reset
      this._detectChangesTimer = undefined;

      // update ui
      this.detectChanges.emit();
    });
  }
  get breadcrumbs(): IV2Breadcrumb[] {
    return this._breadcrumbs;
  }

  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    this.stopDetectChangesTimer();
  }

  /**
   * Stop timer
   */
  private stopDetectChangesTimer(): void {
    if (this._detectChangesTimer) {
      clearTimeout(this._detectChangesTimer);
      this._detectChangesTimer = undefined;
    }
  }
}
