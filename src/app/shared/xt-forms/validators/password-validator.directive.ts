import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-password-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PasswordValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Check if a form field is a valid password:
 *  - minimum length: 6
 *  - must contain at least: 1 lowercase letter, 1 uppercase letter, 1 number and 1 symbol
 */
export class PasswordValidatorDirective implements Validator {
    constructor() {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        const isValid = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).+$/.test(control.value);

        // check if the value is a valid password
        if (!isValid || control.value.length < 6) {
            return {
                passwordValidator: true
            };
        }

        return null;
    }
}
