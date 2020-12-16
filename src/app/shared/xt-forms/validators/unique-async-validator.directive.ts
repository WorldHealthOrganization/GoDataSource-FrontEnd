import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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
export class UniqueAsyncValidatorDirective {

    constructor(
        @Attribute('app-unique-async-validator') public type: string
    ) {
    }

    validate(control: AbstractControl): Observable<ValidationErrors | null> {

        const someAsyncCall = of(true);

        return someAsyncCall
            .pipe(
                map(() => {
                    // return error KEY (string) or null (for success)
                    return {
                        uniqueEmail: true
                    };
                })
            );
    }
}
