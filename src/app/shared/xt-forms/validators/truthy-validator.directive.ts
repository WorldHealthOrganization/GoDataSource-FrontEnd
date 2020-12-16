import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

@Directive({
    selector: '[app-truthy-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TruthyValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for fields that need to be truthy (e.g. Terms and Conditions checkbox must always be checked)
 */
export class TruthyValidatorDirective implements Validator {
    constructor(
        @Attribute('app-truthy-validator') public errorMessageKey: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {

        // check if the value is truthy
        if (!control.value) {
            // generate validation key identifier
            let validationKey = 'truthyValidator';

            if (this.errorMessageKey) {
                validationKey += '-' + this.errorMessageKey;
            }

            const result = {};
            result[validationKey] = false;

            return result;
        }

        return null;
    }
}
