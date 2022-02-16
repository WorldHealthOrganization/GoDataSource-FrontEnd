import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import * as _ from 'lodash';

/**
 * Check if a form field is a valid e-mail address
 */
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
export class EmailValidatorDirective implements Validator {
    constructor() {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        const isValid = control.value.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i);

        // check if the value is an email address
        if (!isValid) {
            return {
                emailValidator: true
            };
        }

        return null;
    }
}
