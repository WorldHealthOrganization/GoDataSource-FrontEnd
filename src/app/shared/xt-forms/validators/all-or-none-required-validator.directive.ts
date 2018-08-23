import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ControlContainer, NgForm, NgModel } from '@angular/forms';

import * as _ from 'lodash';
import { ElementBase } from '../core';

@Directive({
    selector: '[app-all-or-none-required-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AllOrNoneRequiredValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for a list of fields that should be required together
 */
export class AllOrNoneRequiredValidatorDirective implements Validator {
    @Input() requiredList: string[] = [];

    constructor(
        private controlContainer: ControlContainer
    ) {}

    validate(control: AbstractControl): { [key: string]: any } {
        let error = null;

        // fix for bug - not removing error when returning null
        if (
            control.errors &&
            control.errors.allOrNoneRequiredValidator
        ) {
            let errs = _.cloneDeep(control.errors);
            delete errs.allOrNoneRequiredValidator;
            if (Object.keys(errs).length === 0) {
                errs = null;
            }
            control.setErrors(errs);
        }

        // don't validate null values
        if (
            control.value === null ||
            control.value === undefined
        ) {
            return null;
        }

        _.each(this.requiredList, (name: string) => {
            // if we have invalid data we need to let the system know
            if (
                this.controlContainer &&
                this.controlContainer instanceof NgForm &&
                this.controlContainer.controls[name]
            ) {
                // determine compare component
                const target = (_.find((this.controlContainer as any)._directives, {
                    name: name
                }) as NgModel).valueAccessor as ElementBase<any>;

                // don't validate null values
                if (
                    target.value === null ||
                    target.value === undefined
                ) {
                    // jump over this one
                    return;
                }

                // construct error if necessary
                const value: string = control.value.toString();
                const targetValue: string = target.value.toString();
                if ((
                    value &&
                    !targetValue
                ) || (
                    !value &&
                    targetValue
                )) {
                    error = {
                        allOrNoneRequiredValidator: {
                            field: (target as any).placeholder,
                            err: value ?
                                'LNG_FORM_VALIDATION_ERROR_ALL_OR_NONE_REQUIRED' :
                                'LNG_FORM_VALIDATION_ERROR_ALL_OR_NONE_REQUIRED_IF_FIELD_IS_SET'
                        }
                    };
                }

                // do we need to validate counterpart as well ?
                if (
                    target &&
                    target.invalid !== (error ? true : false)
                ) {
                    (function (
                        targetElement: ElementBase<any>
                    ) {
                        setTimeout(() => {
                            // trigger validation
                            targetElement.control.updateValueAndValidity();
                            if ((targetElement as any).onChange) {
                                (targetElement as any).onChange();
                            }
                        }, 500);
                    })(target);

                    // stop each
                    return false;
                }
            }
        });

        return error;
    }
}
