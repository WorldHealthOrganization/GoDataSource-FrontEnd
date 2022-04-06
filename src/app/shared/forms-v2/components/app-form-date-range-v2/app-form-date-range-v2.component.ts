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
import { IV2DateRange } from './models/date.model';

@Component({
  selector: 'app-form-date-range-v2',
  templateUrl: './app-form-date-range-v2.component.html',
  styleUrls: ['./app-form-date-range-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormDateRangeV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormDateRangeV2Component
  extends AppFormBaseV2<IV2DateRange> implements OnDestroy {

  // float label
  @Input() neverFloatLabel: boolean = false;

  // visible
  @Input() fromHidden: boolean;
  @Input() toHidden: boolean;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // parent initialization
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );

    // value initialization
    this.writeValue(undefined);
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
  writeValue(value: IV2DateRange) {
    // don't allow undefined values, but don't mark it as dirty either
    value = value || {
      startDate: undefined,
      endDate: undefined
    };

    // write
    super.writeValue(value);
  }
}
