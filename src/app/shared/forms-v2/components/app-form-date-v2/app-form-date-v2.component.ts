import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional,
  SkipSelf
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { Moment } from '../../../../core/helperClasses/x-moment';

@Component({
  selector: 'app-form-date-v2',
  templateUrl: './app-form-date-v2.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormDateV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormDateV2Component
  extends AppFormBaseV2<string | Moment> implements OnDestroy {

  // float label
  @Input() neverFloatLabel: boolean = false;

  // autocomplete
  @Input() autocomplete: string;

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
