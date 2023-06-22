import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { IV2Breadcrumb, IV2BreadcrumbInfo } from './models/breadcrumb.model';

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

    // don't detect changes when no data
    if (!this._breadcrumbs) {
      return;
    }

    // wait for html to be updated
    this.detectChangesTrigger();
  }
  get breadcrumbs(): IV2Breadcrumb[] {
    return this._breadcrumbs;
  }

  // infos
  private _infos: IV2BreadcrumbInfo[];
  @Input() set infos(infos: IV2BreadcrumbInfo[]) {
    // set data
    this._infos = infos;

    // don't detect changes when no data
    if (!this._infos) {
      return;
    }

    // wait for html to be updated
    this.detectChangesTrigger();
  }
  get infos(): IV2BreadcrumbInfo[] {
    return this._infos;
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

  /**
   * Trigger detect changes
   */
  private detectChangesTrigger(): void {
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
}
