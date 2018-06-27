import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-notEqualValidator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NotEqualValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for fields that should not have the same value (e.g. security questions)
 */
export class NotEqualValidatorDirective implements Validator {
    constructor(
        @Attribute('app-notEqualValidator') public notEqualValidator: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        // get the target control
         const targetControl = control.root.get(this.notEqualValidator);

        // check if the current value and target value match
        if (targetControl && control.value === targetControl.value) {
            return {
                notEqualValidator: false
            };
        }

        return null;
    }
}
