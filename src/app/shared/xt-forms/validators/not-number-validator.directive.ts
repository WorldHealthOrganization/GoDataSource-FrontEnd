import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';
import * as _ from 'lodash';

@Directive({
    selector: '[app-not-number-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NotNumberValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Check if a form field is a valid e-mail address
 */
export class NotNumberValidatorDirective implements Validator {
    validate(control: AbstractControl): { [key: string]: any } {
        if (
            _.isEmpty(control.value) &&
            !_.isNumber(control.value)
        ) {
            return null;
        }

        const isValid: boolean = !_.isNumber(control.value) && (
            !_.isString(control.value) ||
            !/[0-9.]+/.test(control.value)
        );
        return isValid ?
            null : {
                notNumberValidator: true
            };
    }
}
