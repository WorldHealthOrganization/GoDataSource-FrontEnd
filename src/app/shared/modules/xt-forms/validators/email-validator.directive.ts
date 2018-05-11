import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-emailValidator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => EmailValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for fields that should have the same value (e.g. password and confirm password)
 */
export class EmailValidatorDirective implements Validator {
    constructor() {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        const isValid = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(control.value);

        // check if the value is an email address
        if (!isValid) {
            return {
                emailValidator: true
            };
        }

        return null;
    }
}
