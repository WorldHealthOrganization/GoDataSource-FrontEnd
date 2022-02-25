import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Host,
  Input,
  Optional,
  SkipSelf,
  ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { AppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

@Component({
  selector: 'app-form-input-v2',
  templateUrl: './app-form-input-v2.component.html',
  styleUrls: ['./app-form-input-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormInputV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormInputV2Component
  extends AppFormBaseV2<string> {

  // left - icon buttons
  @Input() prefixIconButtons: AppFormIconButtonV2[];

  // right - icon buttons
  @Input() suffixIconButtons: AppFormIconButtonV2[];

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() public controlContainer: ControlContainer,
    protected translateService: TranslateService
  ) {
    super(
      controlContainer,
      translateService
    );
  }

  /**
   * Click button
   */
  iconButtonClick(
    event,
    iconB: AppFormIconButtonV2
  ): void {
    // prevent propagation
    event.stopPropagation();

    // execute click action
    if (iconB.clickAction) {
      iconB.clickAction();
    }
  }
}
