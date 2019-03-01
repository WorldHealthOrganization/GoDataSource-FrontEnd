import { AfterViewInit, Input } from '@angular/core';
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
import { MatTooltip } from '@angular/material';

/**
 * Base class to be extended by custom form controls
 */
export abstract class ElementBase<T> extends ValueAccessorBase<T> implements AfterViewInit {
    // form control name
    protected abstract name: string;
    // form control object
    public control: AbstractControl;

    public validationResult = null;
    private validationResultIsInvalid: boolean = false;
    private validationResultErrMsgs: ElementBaseFailure[];

    // alternative name used for specifying indexes for questionnaire inputs and other places
    @Input() alternativeName: string;

    protected constructor(
        protected controlContainer: ControlContainer,
        private validators: ValidatorArray,
        private asyncValidators: AsyncValidatorArray
    ) {
        super();

        this.registerOnTouched(() => {
            // run validations when element is changed
            this.validate(true);
        });
    }

    /**
     * Validate a custom form control
     */
    protected validate(touch: boolean = false) {
        setTimeout(() => {
            // wait for the next tick so angular can update the form control value
            // before we run the validations
            validate
            (this.validators, this.asyncValidators)
            (this.control)
                .subscribe((res) => {
                    // cache the result
                    this.validationResult = res;

                    // check if we have errors
                    this.validationResultIsInvalid = Object.keys(this.validationResult || {}).length > 0;
                    this.validationResultErrMsgs = Object.keys(this.validationResult || {}).map(k => {
                        const errorMessage = new ErrorMessage(this.validationResult, k);
                        return errorMessage.getMessage();
                    });

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
        return this.validationResultIsInvalid;
    }

    /**
     * Getter for 'failures' property of a custom form control
     * Returns a list of validation error messages for a custom form control.
     * @returns {Array<ElementBaseFailure>}
     */
    protected get failures(): ElementBaseFailure[] {
        return this.validationResultErrMsgs;
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

            // set filtered fields handler if we have one
            if ((this as any).getFilteredValue) {
                (this.control as any).getFilteredValue = () => {
                    return (this as any).getFilteredValue();
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
                    this.validate(true);
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

    /**
     * Display tooltip on-click ( fix for mobile => matTooltip )
     */
    displayTooltip(
        event: MouseEvent,
        tooltip: MatTooltip
    ) {
        // don't propagate to parent
        event.stopPropagation();

        // display tooltip ( Devices - no hover ) - if not already visible from hover ( PC )
        if (tooltip) {
            tooltip.show();
        }
    }
}
