import {
    AbstractControl,
    AsyncValidatorFn,
    Validator,
    Validators,
    ValidatorFn,
} from '@angular/forms';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ValidationResult { [validator: string]: string | boolean; }

export type AsyncValidatorArray = Array<Validator | AsyncValidatorFn>;

export type ValidatorArray = Array<Validator | ValidatorFn>;

const normalizeValidator =
    (validator: Validator | ValidatorFn): ValidatorFn => {
        const func = (validator as Validator).validate.bind(validator);
        if (typeof func === 'function') {
            return (c: AbstractControl) => func(c);
        } else {
            return <ValidatorFn> validator;
        }
    };

export const composeValidators =
    (validators: ValidatorArray): AsyncValidatorFn | ValidatorFn => {
        if (validators == null || validators.length === 0) {
            return null;
        }
        return Validators.compose(validators.map(normalizeValidator));
    };

const normalizeAsyncValidator =
    (validator: Validator | AsyncValidatorFn): AsyncValidatorFn => {
        const func = (validator as Validator).validate.bind(validator);
        if (typeof func === 'function') {
            return (c: AbstractControl) => func(c);
        } else {
            return <AsyncValidatorFn> validator;
        }
    };

export const composeAsyncValidators =
    (validators: AsyncValidatorArray): AsyncValidatorFn => {
        if (validators == null || validators.length === 0) {
            return null;
        }
        return Validators.composeAsync(validators.map(normalizeAsyncValidator));
    };

export const validate =
    (validators: ValidatorArray, asyncValidators: AsyncValidatorArray) => {
        return (control: AbstractControl) => {

            if (!control) {
                return of(null);
            }

            const synchronousValid = () => composeValidators(validators)(control);

            if (asyncValidators) {

                const asyncValidator: any = composeAsyncValidators(asyncValidators);

                return asyncValidator(control)
                    .pipe(
                        map(v => {
                            const secondary = synchronousValid();
                            if (secondary || v) {
                                // compose async and sync validator results
                                return Object.assign({}, secondary, v);
                            }
                        })
                    );
            }

            if (validators) {
                return of(synchronousValid());
            }

            return of(null);
        };
    };
