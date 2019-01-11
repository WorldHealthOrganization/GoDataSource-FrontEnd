import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-url-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => UrlValidatorDirective),
            multi: true
        }
    ]
})

/**
 *Check if the url is in a proper format
 */
export class UrlValidatorDirective implements Validator {
    constructor() {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (_.isEmpty(control.value)) {
            return null;
        }

        const isValid = !control.value.includes('localhost');

        if (!isValid) {
            return {
                urlValidator: true
            };
        }

        return null;
    }
}
