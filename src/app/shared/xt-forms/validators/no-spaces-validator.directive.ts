import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * Check if a form field is a valid e-mail address
 */
@Directive({
  selector: '[app-no-spaces-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NoSpacesValidatorDirective),
      multi: true
    }
  ]
})
export class NoSpacesValidatorDirective implements Validator {
  // validate ?
  @Input() noSpacesValidatorDisabled: boolean = false;

  /**
   * Validate
   */
  validate(control: AbstractControl): { noSpaces: true } {
    // disabled ?
    if (
      this.noSpacesValidatorDisabled ||
      !control.value ||
      typeof control.value !== 'string'
    ) {
      return;
    }

    // validate
    return control.value.indexOf(' ') < 0 ?
      null : {
        noSpaces: true
      };
  }
}
