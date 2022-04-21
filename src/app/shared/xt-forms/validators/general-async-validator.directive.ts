import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, timer, of } from 'rxjs';
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
  @Input() asyncValidatorTouchOnError: boolean = false;
  @Input() validateOnlyWhenDirty: boolean = false;
  @Input() asyncValidatorObservable: Observable<boolean | IGeneralAsyncValidatorResponse>;
  @Input() asyncValidatorErrMsg: string = 'LNG_FORM_VALIDATION_ERROR_GENERAL_ASYNC';
  @Input() asyncValidatorErrMsgTranslateData: {
    [key: string]: any
  };

  // previous validated value
  private _previousValue: any;
  private _previousResponse: any = null;

  /**
   * Validate
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // no need to validate ?
    // - requires job
    if (
      !control.value &&
      control.value !== 0
    ) {
      return of(null);
    }

    // no need to validate if same as previous value ?
    if (this._previousValue === control.value) {
      return of(this._previousResponse);
    }

    // no need to validate when not dirty ?
    if (
      this.validateOnlyWhenDirty &&
      !control.dirty
    ) {
      return of(this._previousResponse);
    }

    // wait for binding
    return timer(Constants.DEFAULT_DEBOUNCE_TIME_MILLISECONDS)
      .pipe(
        switchMap(() => {
          // nothing to validate ?
          if (
            !this.asyncValidatorObservable ||
            (
              !control.value &&
              control.value !== 0
            ) || (
              this.validateOnlyWhenDirty &&
              !control.dirty
            )
          ) {
            return of(null);
          }

          // update previous value
          this._previousValue = control.value;

          // execute validator
          return this.asyncValidatorObservable
            .pipe(
              map((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                if (typeof isValid === 'boolean') {
                  // not valid and we need to touch ?
                  if (
                    !isValid &&
                    this.asyncValidatorTouchOnError
                  ) {
                    control.markAsTouched();
                  }

                  // set response
                  this._previousResponse = isValid ?
                    null : {
                      generalAsyncValidatorDirective: {
                        err: this.asyncValidatorErrMsg,
                        details: this.asyncValidatorErrMsgTranslateData
                      }
                    };
                } else {
                  // process response
                  const data: IGeneralAsyncValidatorResponse = isValid as IGeneralAsyncValidatorResponse;

                  // not valid and we need to touch ?
                  if (
                    !data.isValid &&
                    this.asyncValidatorTouchOnError
                  ) {
                    control.markAsTouched();
                  }

                  // set response
                  this._previousResponse = data.isValid ?
                    null : {
                      generalAsyncValidatorDirective: {
                        err: data.errMsg ? data.errMsg : this.asyncValidatorErrMsg,
                        details: data.errMsgData ? data.errMsgData : this.asyncValidatorErrMsgTranslateData
                      }
                    };
                }

                // finished
                return this._previousResponse;
              })
            );
        })
      );
  }
}
