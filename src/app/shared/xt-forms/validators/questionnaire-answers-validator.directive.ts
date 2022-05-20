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
  ) {
  }

  /**
   * Validate
   */
  validate(): { questionnaireAnswer: true } {
    console.log(this.component.name, this.component.hasErrors);

    // sau sa fie ceva facut de control..si asta doar sa verifice
    // this.control.invalidValues...
    // this.control.invalidValues...
    // this.control.invalidValues...
    // this.control.invalidValues...
    // this.control.invalidValues...
    // ca daca e sa fac aici for..nici nu stiu ce e afisat si mai tb sa si trec prin toate
    // console.log(control.value);

    // finished
    return null;

    // // disabled ?
    // if (
    //   this.noSpacesValidatorDisabled ||
    //   !control.value ||
    //   typeof control.value !== 'string'
    // ) {
    //   return;
    // }
    //
    // // validate
    // return control.value.indexOf(' ') < 0 ?
    //   null : {
    //     questionnaireAnswer: true
    //   };
  }
}
