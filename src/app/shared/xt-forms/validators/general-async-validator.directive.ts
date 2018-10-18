import { Directive, forwardRef, Input } from '@angular/core';
import { AsyncValidator, AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { Constants } from '../../../core/models/constants';

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
            return Observable.timer(Constants.DEFAULT_DEBOUNCE_TIME_MILLISECONDS).switchMap(() => {
                return this.asyncValidatorObservable
                    .map((isValid: boolean) => {
                        // finished
                        if (isValid) {
                            return null;
                        } else {
                            return {
                                generalAsyncValidatorDirective: {
                                    err: this.asyncValidatorErrMsg,
                                    details: this.asyncValidatorErrMsgTranslateData
                                }
                            };
                        }
                    });
            });
        }
    }
}
