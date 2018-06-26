import { AfterViewInit, EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NgModel } from '@angular/forms';
import { GroupValidator } from './group-validator';

import * as _ from 'lodash';
import { ValueAccessorBase } from './value-accessor-base';

/**
 * Base class to be extended by custom form controls to handle groups of atomic form components
 */
export abstract class GroupBase<T> extends GroupValidator<T> implements AfterViewInit {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `group-${GroupBase._identifier++}`;

    // group input name
    @Input() name: string;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T>();

    // triggers when group has been initialized
    @Output() groupInitialized = new EventEmitter<T>();

    /**
     * Constructor
     */
    protected constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange() {
        // validate group
        super.validateGroup();

        // mark as dirty
        if (this.control) {
            this.control.markAsDirty();
        }

        // call changed event
        return this.changed.emit(this.value);
    }

    /**
     * Initialize Group
     */
    ngAfterViewInit() {
        // initialize parent
        super.ngAfterViewInit();

        // wait for the Form object to be initialized with form controls,
        // then get the current form control object
        setTimeout(() => {
            // validate group
            this.validateGroup();

            // trigger group initialized
            this.groupInitialized.emit();
        });
    }

    /**
     * Override touch function
     */
    public touch() {
        // touch children
        if (this.controlContainer) {
            const formDirectives = _.get(this.controlContainer, '_directives', []);
            _.forEach(formDirectives, (ngModel: NgModel) => {
                const groupFormDirectives = _.get(ngModel, 'valueAccessor.groupForm._directives', []);
                _.forEach(groupFormDirectives, (groupModel: NgModel) => {
                    if (
                        groupModel.valueAccessor &&
                        groupModel.valueAccessor instanceof ValueAccessorBase
                    ) {
                        (groupModel.valueAccessor as ValueAccessorBase<any>).touch();
                    }
                });
            });
        }
    }

    /**
     * Override validate functions
     */
    protected validate() {
        // call parent
        super.validate();

        // touch list
        this.touch();
    }
}
