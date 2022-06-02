import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

@Directive({
  selector: '[app-has-property-validator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HasPropertyDirective),
      multi: true
    }
  ]
})
export class HasPropertyDirective implements Validator {
  // object checked for property existence
  @Input() checkObject: {
    [prop: string]: any
  };

  // error message
  @Input() checkErrorMsg: string = 'LNG_FORM_VALIDATION_ERROR_GENERAL_HAS_PROPERTY';

  /**
     * Validate
     * @param control
     */
  validate(control: AbstractControl): { [key: string]: any } {
    // no point in validating empty values, this is handled by required validator
    if (
      !control.value ||
      !this.checkObject
    ) {
      return null;
    }

    // get value
    let value: any = control.value;
    if (typeof value === 'string') {
      value = value.toLowerCase();
    }

    // check property
    if (this.checkObject[value] !== undefined) {
      return {
        hasPropertyValidator: {
          err: this.checkErrorMsg
        }
      };
    }

    // property doesn't exist
    return null;
  }
}
