import {Attribute, Directive, forwardRef} from '@angular/core';
import {AsyncValidator, AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors} from '@angular/forms';
import { Observable } from 'rxjs/Observable';

@Directive({
    selector: '[app-unique-async-validator][ngModel]',
    providers: [
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => UniqueAsyncValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Async validator
 */
export class UniqueAsyncValidatorDirective implements AsyncValidator {

    constructor(
        @Attribute('app-unique-async-validator') public type: string,
    ) {
    }

    validate(control: AbstractControl): Observable<ValidationErrors> {

        const someAsyncCall = Observable.of(true);

        return someAsyncCall
            .map((res: boolean) => {
                // return error KEY (string) or null (for success)
                return {
                    uniqueEmail: true
                };
            });
    }
}
