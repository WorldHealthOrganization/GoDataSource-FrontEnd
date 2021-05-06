import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

/**
 * Check if a form field matches regex expression
 */
@Directive({
    selector: '[app-regex-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => RegexValidatorDirective),
            multi: true
        }
    ]
})
export class RegexValidatorDirective implements Validator {
    // regex expression
    @Input() regexExpr: string;

    // regex expression flags
    @Input() regexExprFlags: string;

    // message displayed instead of the default one
    @Input() regexExprMsg: string;

    /**
     * Called when we need to validate control value
     */
    validate(
        control: AbstractControl
    ): {
        regexNotMatched: {
            msg?: string
        }
    } {
        // we don't validate empty, that is required's job...
        if (
            control.value === '' ||
            control.value === undefined ||
            control.value === null ||
            !this.regexExpr
        ) {
            return;
        }

        // regex validator
        const value: string = typeof control.value === 'string' ?
            control.value :
            control.value.toString();
        if (!value.match(new RegExp(
            this.regexExpr,
            this.regexExprFlags
        ))) {
            return {
                regexNotMatched: {
                    msg: this.regexExprMsg
                }
            };
        }
    }
}
