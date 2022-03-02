import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
  @Input() breadcrumbs: IV2Breadcrumb[];
}
