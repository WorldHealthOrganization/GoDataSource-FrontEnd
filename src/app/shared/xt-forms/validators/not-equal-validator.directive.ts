import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * Custom form validation for fields that should not have the same value (e.g. security questions)
 */
@Directive({
  selector: '[app-not-equal-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NotEqualValidatorDirective),
      multi: true
    }
  ]
})
export class NotEqualValidatorDirective implements Validator {
  // input
  @Input() notEqualValidatorCompareTo: string;
  @Input() notEqualValidatorError: string;

  /**
   * Validate
   */
  validate(control: AbstractControl): { [key: string]: any } {
    // nothing to validate ?
    if (
      !control.value ||
      !this.notEqualValidatorCompareTo
    ) {
      return null;
    }

    // get the target control
    const targetControl = control.root.get(this.notEqualValidatorCompareTo);

    // check if the current value and target value match
    if (targetControl && control.value === targetControl.value) {
      return {
        notEqualValidator: {
          err: this.notEqualValidatorError
        }
      };
    }

    // valid
    return null;
  }
}
