import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChangeValue, ChangeValueType } from './models/change.model';

/**
 * Component
 */
@Component({
  selector: 'app-changes-v2',
  templateUrl: './app-changes-v2.component.html',
  styleUrls: ['./app-changes-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppChangesV2Component {
  // changes
  @Input() changes: ChangeValue[];

  // constants
  ChangeValueType = ChangeValueType;
}
