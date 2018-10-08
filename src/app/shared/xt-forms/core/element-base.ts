import { AfterViewInit } from '@angular/core';
import { AbstractControl, ControlContainer } from '@angular/forms';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';

import * as _ from 'lodash';

import { ValueAccessorBase } from './value-accessor-base';

import {
    AsyncValidatorArray,
    ValidatorArray,
    validate,
} from './validate';
import { ErrorMessage } from './error-message';
import { ElementBaseFailure } from './element-base-failure';

/**
 * Base class to be extended by custom form controls
 */
export abstract class ElementBase<T> extends ValueAccessorBase<T> implements AfterViewInit {
    // form control name
    protected abstract name: string;
    // form control object
    public control: AbstractControl;

    public validationResult = null;

    protected constructor(
        protected controlContainer: ControlContainer,
        private validators: ValidatorArray,
        private asyncValidators: AsyncValidatorArray
    ) {
        super();

        this.registerOnTouched(() => {
            // run validations when element is changed
            this.validate();
        });
    }

    /**
     * Validate a custom form control
     */
    protected validate() {
        setTimeout(() => {
            // wait for the next tick so angular can update the form control value
            // before we run the validations
            validate
            (this.validators, this.asyncValidators)
            (this.control)
                .subscribe((res) => {
                    // cache the result
                    this.validationResult = res;
                    return res;
                });
        });
    }

    /**
     * Getter for 'invalid' property of a custom form control.
     * Returns whether a custom form control is invalid.
     * @returns {boolean}
     */
    public get invalid(): boolean {
        return Object.keys(this.validationResult || {}).length > 0;
    }

    /**
     * Getter for 'failures' property of a custom form control
     * Returns a list of validation error messages for a custom form control.
     * @returns {Array<ElementBaseFailure>}
     */
    protected get failures(): Array<ElementBaseFailure> {
        return Object.keys(this.validationResult || {}).map(k => {
            const errorMessage = new ErrorMessage(this.validationResult, k);
            return errorMessage.getMessage();
        });
    }

    /**
     * Get form control object
     */
    private getControl(): void {
        const formControl = _.get(this.controlContainer, 'control', null);
        if (formControl) {
            this.control = formControl.get(this.name);
            if (!this.control) {
                // try again later
                setTimeout(() => {
                    this.getControl();
                });
                return;
            }

            // set dirty handler if we have one
            if ((this as any).getDirtyFields) {
                (this.control as any).getDirtyFields = () => {
                    return (this as any).getDirtyFields();
                };
            }

            // run validations when form control value is changed
            this.control.valueChanges
                // add debounce to run validations when user stops typing
                .debounceTime(500)
                .subscribe(() => {
                    this.validate();
                });

            // get the 'ngSubmit' EventEmitter of the Form Control Container
            const ngSubmitEvent = _.get(this.controlContainer, 'ngSubmit', null);
            if (ngSubmitEvent) {
                ngSubmitEvent.subscribe(() => {
                    // run validations when form is submitted
                    this.validate();
                });
            }

        }
    }

    ngAfterViewInit() {
        // wait for the Form object to be initialized with form controls,
        // then get the current form control object
        setTimeout(() => {
            this.getControl();
        });
    }
}
