import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-required-one-or-other-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => RequiredOneOrOtherValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for too fields, from which at least one should be filled
 */
export class RequiredOneOrOtherValidatorDirective implements Validator {
    @Input() requiredOtherField: string;

    validate(control: AbstractControl): { [key: string]: any } {
        // no other field selected ?
        if (_.isEmpty(this.requiredOtherField)) {
            return null;
        }

        // get the target control
        const targetControl = control.root.get(this.requiredOtherField);

        // check if both are empty
        let err = null;
        if (
            _.isEmpty(control.value) && (
                _.isEmpty(targetControl) ||
                _.isEmpty(targetControl.value)
            )
        ) {
            // finished
            err = {
                requiredOtherField: true
            };
        }

        // refresh
        if (
            targetControl &&
            targetControl.invalid !== !!err
        ) {
            setTimeout(() => {
                targetControl.updateValueAndValidity();
            }, 200);
        }


        // no validation errors
        return err;
    }
}
