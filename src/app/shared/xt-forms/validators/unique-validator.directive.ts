import { Attribute, Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, FormGroup } from '@angular/forms';
import * as _ from 'lodash';

/**
 * Custom form validation for fields that should not have the same value (e.g. security questions)
 */
@Directive({
    selector: '[app-unique-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => UniqueValidatorDirective),
            multi: true
        }
    ]
})
export class UniqueValidatorDirective implements Validator {
    private regex: RegExp;

    constructor(
        @Attribute('app-unique-validator') private appUniqueValidator: string
    ) {
        this.regex = new RegExp( appUniqueValidator, 'i');
    }

    validate(control: AbstractControl): { [key: string]: any } {
        // no point in validating empty values, this is handled by required validator
        if (_.isEmpty(control.value)) {
            return null;
        }

        // count field values so we can determine duplicates
        let countedItems: number = 0;
        if (
            control.root &&
            control.root instanceof FormGroup &&
            control.root.controls
        ) {
            _.each(control.root.controls, (ctrl: AbstractControl, name: string) => {
                if (
                    this.regex.test(name) &&
                    _.isString(ctrl.value) &&
                    ctrl.value.toLowerCase() === control.value.toLowerCase()
                ) {
                    countedItems++;
                }
            });
        }

        // determine if this field has a duplicate value
        if (countedItems > 1) {
            return {
                notUniqueValidator: false
            };
        }

        // not a duplicate
        return null;
    }
}
