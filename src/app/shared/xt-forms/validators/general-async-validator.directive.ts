import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, timer, of } from 'rxjs';
import * as _ from 'lodash';
import { Constants } from '../../../core/models/constants';
import { map, switchMap } from 'rxjs/operators';

export interface IGeneralAsyncValidatorResponse {
    isValid: boolean;
    errMsg?: string;
    errMsgData?: any;
}

/**
 * Async validator
 */
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
export class GeneralAsyncValidatorDirective {
    @Input() validateOnlyWhenDirty: boolean = false;
    @Input() asyncValidatorObservable: Observable<boolean | IGeneralAsyncValidatorResponse>;
    @Input() asyncValidatorErrMsg: string = 'LNG_FORM_VALIDATION_ERROR_GENERAL_ASYNC';
    @Input() asyncValidatorErrMsgTranslateData: {
        [key: string]: any
    };

    /**
     * Validate
     */
    validate(control: AbstractControl): Observable<ValidationErrors | null> {
        // wait for binding
        return timer(Constants.DEFAULT_DEBOUNCE_TIME_MILLISECONDS)
            .pipe(
                switchMap(() => {
                    // nothing to validate ?
                    if (
                        !this.asyncValidatorObservable ||
                        _.isEmpty(control.value) || (
                            this.validateOnlyWhenDirty &&
                            !control.dirty
                        )
                    ) {
                        return of(null);
                    }

                    // execute validator
                    return this.asyncValidatorObservable
                        .pipe(
                            map((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                                if (_.isBoolean(isValid)) {
                                    return isValid ?
                                        null : {
                                            generalAsyncValidatorDirective: {
                                                err: this.asyncValidatorErrMsg,
                                                details: this.asyncValidatorErrMsgTranslateData
                                            }
                                        };
                                } else {
                                    const data: IGeneralAsyncValidatorResponse = isValid as IGeneralAsyncValidatorResponse;
                                    return data.isValid ?
                                        null : {
                                            generalAsyncValidatorDirective: {
                                                err: data.errMsg ? data.errMsg : this.asyncValidatorErrMsg,
                                                details: data.errMsgData ? data.errMsgData : this.asyncValidatorErrMsgTranslateData
                                            }
                                        };
                                }
                            })
                        );
                })
            );
    }
}
