import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-equalValidator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => EqualValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for fields that should have the same value (e.g. password and confirm password)
 */
export class EqualValidatorDirective implements Validator {
    constructor(
        @Attribute('app-equalValidator') public equalValidator: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        // get password control
        const passwordControl = control.root.get(this.equalValidator);

        // check if the passwords match
        if (passwordControl && control.value !== passwordControl.value) {
            return {
                equalValidator: false
            };
        }

        return null;
    }
}