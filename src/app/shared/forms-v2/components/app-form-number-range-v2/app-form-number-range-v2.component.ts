import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional,
  SkipSelf
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IV2NumberRange } from './models/number.model';

@Component({
  selector: 'app-form-number-range-v2',
  templateUrl: './app-form-number-range-v2.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormNumberRangeV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormNumberRangeV2Component
  extends AppFormBaseV2<IV2NumberRange> implements OnDestroy {

  // min / max
  @Input() min: number;
  @Input() max: number;

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
   * Write value
   */
  writeValue(value: IV2NumberRange) {
    // don't allow undefined values, but don't mark it as dirty either
    value = value || {
      from: undefined,
      to: undefined
    };

    // write
    super.writeValue(value);
  }
}
