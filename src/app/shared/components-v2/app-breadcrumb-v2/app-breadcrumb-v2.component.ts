import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
export class AppBreadcrumbV2Component {
  // breadcrumbs
  private _breadcrumbs: IV2Breadcrumb[];
  @Input() set breadcrumbs(breadcrumbs: IV2Breadcrumb[]) {
    // set data
    this._breadcrumbs = breadcrumbs;

    // don't update on null values
    if (!this._breadcrumbs) {
      return;
    }

    // wait for html to be updated
    setTimeout(() => {
      // update ui
      this.detectChanges.emit();
    });
  }
  get breadcrumbs(): IV2Breadcrumb[] {
    return this._breadcrumbs;
  }

  // detect changes
  @Output() detectChanges = new EventEmitter<void>();
}
