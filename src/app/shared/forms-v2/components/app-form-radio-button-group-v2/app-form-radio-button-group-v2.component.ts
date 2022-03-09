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
import { ILabelValuePairModel } from '../../core/label-value-pair.model';

@Component({
  selector: 'app-form-radio-button-v2',
  templateUrl: './app-form-radio-button-group-v2.component.html',
  styleUrls: ['./app-form-radio-button-group-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormRadioButtonGroupV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormRadioButtonGroupV2Component
  extends AppFormBaseV2<string> implements OnDestroy {
  // options
  @Input() options: ILabelValuePairModel[];

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
