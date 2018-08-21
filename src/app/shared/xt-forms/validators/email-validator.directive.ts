import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-email-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => EmailValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Check if a form field is a valid e-mail address
 */
export class EmailValidatorDirective implements Validator {
    constructor() {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        const isValid = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/i.test(control.value);

        // check if the value is an email address
        if (!isValid) {
            return {
                emailValidator: true
            };
        }

        return null;
    }
}
