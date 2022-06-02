import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * Custom form validation for fields that should have the same value (e.g. password and confirm password)
 */
@Directive({
  selector: '[app-equal-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EqualValidatorDirective),
      multi: true
    }
  ]
})
export class EqualValidatorDirective implements Validator {
  // input
  @Input() equalValidatorCompareTo: string;
  @Input() equalValidatorError: string;

  /**
   * Validate
   */
  validate(control: AbstractControl): { [key: string]: any } {
    // nothing to validate ?
    if (
      !control.value ||
      !this.equalValidatorCompareTo
    ) {
      return null;
    }

    // get the target control
    const targetControl = control.root.get(this.equalValidatorCompareTo);

    // check if the current value and target value match
    if (targetControl && control.value !== targetControl.value) {
      return {
        equalValidator: {
          err: this.equalValidatorError
        }
      };
    }

    // valid
    return null;
  }
}
