import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import * as _ from 'lodash';
import * as Isemail from 'isemail';

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

        const isValid = Isemail.validate(control.value);

        // check if the value is an email address
        if (!isValid) {
            return {
                emailValidator: true
            };
        }

        return null;
    }
}
