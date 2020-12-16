import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-equal-validator][ngModel]',
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
        @Attribute('app-equal-validator') public equalValidator: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        // get the target control
        const targetControl = control.root.get(this.equalValidator);

        // check if the current value and target value match
        if (targetControl && control.value !== targetControl.value) {
            return {
                equalValidator: false
            };
        }

        return null;
    }
}
