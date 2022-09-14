import { Directive, forwardRef } from '@angular/core';
import { Validator, NG_VALIDATORS } from '@angular/forms';
import { AppFormFillQuestionnaireV2Component } from '../../forms-v2/components/app-form-fill-questionnaire-v2/app-form-fill-questionnaire-v2.component';

/**
 * Check if a form field has valid questionnaire answers
 */
@Directive({
  selector: '[app-questionnaire-answers-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => QuestionnaireAnswersValidatorDirective),
      multi: true
    }
  ]
})
export class QuestionnaireAnswersValidatorDirective implements Validator {
  /**
   * Constructor
   */
  constructor(
    private component: AppFormFillQuestionnaireV2Component
  ) {}

  /**
   * Validate
   */
  validate(): { questionnaireAnswer: true } {
    return this.component.hasErrors ?
      {
        questionnaireAnswer: true
      } :
      null;
  }
}
