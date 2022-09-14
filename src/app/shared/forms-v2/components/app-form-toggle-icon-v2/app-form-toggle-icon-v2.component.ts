import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional,
  SkipSelf, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';

@Component({
  selector: 'app-form-toggle-icon-v2',
  templateUrl: './app-form-toggle-icon-v2.component.html',
  styleUrls: ['./app-form-toggle-icon-v2.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppFormToggleIconV2Component),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormToggleIconV2Component
  extends AppFormBaseV2<boolean> implements OnDestroy {

  // icon
  @Input() icon: string;

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
}
