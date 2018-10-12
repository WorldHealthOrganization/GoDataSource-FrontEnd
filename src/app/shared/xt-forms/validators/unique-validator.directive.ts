import { Attribute, Directive, forwardRef, Input } from '@angular/core';
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

    @Input() valueReplacer: (name: string, value: string) => string;

    private _appUniqueValidatorExpression: string;
    @Input() set appUniqueValidatorExpression(value: string) {
        this._appUniqueValidatorExpression = value;
        this.regex = new RegExp(this._appUniqueValidatorExpression, 'i');
    }
    get appUniqueValidatorExpression(): string {
        return this._appUniqueValidatorExpression;
    }

    @Input() additionalControlsToCheck: { [ name: string ]: AbstractControl };

    constructor(
        @Attribute('app-unique-validator') private appUniqueValidator: string
    ) {
        if (appUniqueValidator) {
            this.regex = new RegExp(appUniqueValidator, 'i');
        }
    }

    validate(control: AbstractControl): { [key: string]: any } {
        // no point in validating empty values, this is handled by required validator
        if (_.isEmpty(control.value)) {
            return null;
        }

        // get control name
        let controlName: string = '';
        if (control.parent instanceof FormGroup) {
            _.each(control.parent.controls, (ctrl: AbstractControl, name) => {
                if (control === ctrl) {
                    controlName = name;
                }
            });
        }

        // count field values so we can determine duplicates
        let countedItems: number = 0;
        if (
            control.root &&
            control.root instanceof FormGroup &&
            control.root.controls
        ) {
            _.each(
                {
                    ...control.root.controls,
                    ...this.additionalControlsToCheck
                }, (ctrl: AbstractControl, name: string) => {
                if (
                    this.regex &&
                    this.regex.test(name) &&
                    _.isString(ctrl.value)
                ) {
                    if (
                        (
                            this.valueReplacer ?
                                this.valueReplacer(name, ctrl.value) :
                                ctrl.value
                        ).toLowerCase() === (
                            this.valueReplacer ?
                                this.valueReplacer(controlName, control.value) :
                                control.value
                        ).toLowerCase()
                    ) {
                        countedItems++;
                    } else if (ctrl.value.toLowerCase() === control.value.toLowerCase()) {
                        if (
                            ctrl.errors &&
                            ctrl.errors.notUniqueValidator
                        ) {
                            ((lCrl: AbstractControl) => {
                                setTimeout(
                                    () => {
                                        lCrl.updateValueAndValidity();
                                    },
                                    200
                                );
                            })(ctrl);
                        }
                    }
                }
            });
        }

        // determine if this field has a duplicate value
        if (countedItems > 1) {
            return {
                notUniqueValidator: true
            };
        }

        // not a duplicate
        return null;
    }
}
