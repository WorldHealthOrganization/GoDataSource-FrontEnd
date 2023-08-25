import { Directive, forwardRef } from '@angular/core';
import { Validator, NG_VALIDATORS } from '@angular/forms';
import { AppFormVisibleMandatoryV2Component } from '../../forms-v2/components/app-form-visible-mandatory-v2/app-form-visible-mandatory-v2.component';

/**
 * Check if a form field has valid visible/mandatory
 */
@Directive({
  selector: '[app-visible-mandatory-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VisibleMandatoryValidatorDirective),
      multi: true
    }
  ]
})
export class VisibleMandatoryValidatorDirective implements Validator {
  /**
   * Constructor
   */
  constructor(
    private component: AppFormVisibleMandatoryV2Component
  ) {}

  /**
   * Validate
   */
  validate(): { visibleMandatory: true } {
    return this.component.hasErrors ?
      {
        visibleMandatory: true
      } :
      null;
  }
}
