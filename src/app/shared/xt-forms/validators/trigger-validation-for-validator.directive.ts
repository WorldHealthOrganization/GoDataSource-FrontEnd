import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * When running the validation for the current form element, do also trigger
 *  the validations for other (target) elements within the same form
 */
@Directive({
    selector: '[app-trigger-validation-for][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TriggerValidationForValidatorDirective),
            multi: true
        }
    ]
})
export class TriggerValidationForValidatorDirective implements Validator {
    constructor(
        @Attribute('app-trigger-validation-for') public target: string
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
