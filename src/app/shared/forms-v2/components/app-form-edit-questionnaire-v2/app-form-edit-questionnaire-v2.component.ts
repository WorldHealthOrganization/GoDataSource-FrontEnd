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
import { QuestionModel } from '../../../../core/models/question.model';

@Component({
  selector: 'app-form-edit-questionnaire-v2',
  templateUrl: './app-form-edit-questionnaire-v2.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormEditQuestionnaireV2Component),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormEditQuestionnaireV2Component
  extends AppFormBaseV2<QuestionModel[]> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // parent
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );

    // detach update - custom handled
    changeDetectorRef.detach();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
    console.log(1);
  }
}
