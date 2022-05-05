import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  OnDestroy,
  Optional,
  SkipSelf
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

@Component({
  selector: 'app-form-password-v2',
  templateUrl: './app-form-password-v2.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormPasswordV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormPasswordV2Component
  extends AppFormBaseV2<string> implements OnDestroy {

  // input type
  type: string = 'password';

  // right - show / hide password
  showHideButton: IAppFormIconButtonV2 = {
    icon: 'visibility',
    clickAction: () => {
      // toggle
      if (this.type === 'password') {
        this.type = 'text';
        this.showHideButton.icon = 'visibility_off';
      } else {
        this.type = 'password';
        this.showHideButton.icon = 'visibility';
      }
    }
  };

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Click button
   */
  iconButtonClick(
    event,
    iconB: IAppFormIconButtonV2
  ): void {
    // prevent propagation
    event.stopPropagation();

    // execute click action
    if (iconB.clickAction) {
      iconB.clickAction(this);
    }
  }
}
