import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-min-max-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MinMaxValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Check if a form field has valid numbers
 */
export class MinMaxValidatorDirective implements Validator {
    @Input() minNumber: number;
    @Input() maxNumber: number;

    validate(control: AbstractControl): { [key: string]: any } {
        // do we need to validate min & max ?
        if (
            (
                _.isEmpty(control.value) &&
                !_.isNumber(control.value)
            ) || (
                !_.isNumber(this.minNumber) &&
                !_.isNumber(this.maxNumber)
            )
        ) {
            return null;
        }

        // validate => min
        if (
            _.isNumber(this.minNumber) &&
            control.value < this.minNumber
        ) {
            return {
                minNumberValidator: {
                    min: this.minNumber
                }
            };
        }

        // validate => min
        if (
            _.isNumber(this.maxNumber) &&
            control.value > this.maxNumber
        ) {
            return {
                maxNumberValidator: {
                    max: this.maxNumber
                }
            };
        }

        // everything is just fine
        return null;
    }
}
