import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * When running the validation for the current form element, do also trigger
 *  the validations for other (target) elements within the same form
 */
@Directive({
  selector: '[app-trigger-validation-for][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TriggerValidationForValidatorDirective),
      multi: true
    }
  ]
})
export class TriggerValidationForValidatorDirective implements Validator {
  // input
  @Input() triggerValidationFor: string;

  /**
   * Validate
   */
  validate(control: AbstractControl): null {
    // nothing to do ?
    if (!this.triggerValidationFor) {
      return null;
    }

    // get the target control
    const targetControl = control.root.get(this.triggerValidationFor);

    // trigger validation
    if (targetControl) {
      targetControl.updateValueAndValidity();
    }

    // finished
    return null;
  }
}
