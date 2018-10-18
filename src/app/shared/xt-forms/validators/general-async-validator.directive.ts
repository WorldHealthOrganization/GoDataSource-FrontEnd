import { Directive, forwardRef, Input } from '@angular/core';
import { AsyncValidator, AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Subscriber } from 'rxjs/Subscriber';

@Directive({
    selector: '[app-general-async-validator][ngModel]',
    providers: [
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => GeneralAsyncValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Async validator
 */
export class GeneralAsyncValidatorDirective implements AsyncValidator {
    @Input() asyncValidatorObservable: Observable<boolean>;
    @Input() asyncValidatorErrMsg: string = 'LNG_FORM_VALIDATION_ERROR_GENERAL_ASYNC';
    @Input() asyncValidatorErrMsgTranslateData: {
        [key: string]: any
    };

    validate(control: AbstractControl): Observable<ValidationErrors> {
        if (
            !this.asyncValidatorObservable ||
            _.isEmpty(control.value)
        ) {
            return Observable.of(null);
        } else {
            return Observable.create((observer: Subscriber<ValidationErrors>) => {
                this.asyncValidatorObservable
                    .subscribe((isValid: boolean) => {
                        // finished
                        if (isValid) {
                            observer.next(null);
                        } else {
                            observer.next({
                                generalAsyncValidatorDirective: {
                                    err: this.asyncValidatorErrMsg,
                                    details: this.asyncValidatorErrMsgTranslateData
                                }
                            });
                        }

                        // finished
                        observer.complete();
                    });
            });

        }
    }
}
