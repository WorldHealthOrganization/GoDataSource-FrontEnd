import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-triggerValidationFor][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TriggerValidationForValidatorDirective),
            multi: true
        }
    ]
})

/**
 * When running the validation for the current form element, do also trigger
 *  the validations for other (target) elements within the same form
 */
export class TriggerValidationForValidatorDirective implements Validator {
    constructor(
        @Attribute('app-triggerValidationFor') public target: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {

        // get the target control
        const targetControl = control.root.get(this.target);

        // trigger validation
        if (targetControl) {
            targetControl.updateValueAndValidity();
        }

        return null;
    }
}
