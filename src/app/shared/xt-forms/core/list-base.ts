import { EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NgModel } from '@angular/forms';
import { GroupValidator } from './group-validator';
import * as _ from 'lodash';
import { ValueAccessorBase } from './value-accessor-base';

/**
 * Base class to be extended by components that implement lists of group components or single components
 */
export abstract class ListBase<T> extends GroupValidator<T[]> {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `list-${ListBase._identifier++}`;

    // group input name
    @Input() name: string;

    // converts value to something else
    @Input() valueMap;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T>();

    @Input() removeConfirmMsg: string = 'Are you sure you want to delete this item?';

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
        return this.changed.emit(this.valueMap ? this.valueMap(this.value) : this.value);
    }

    /**
     * Model array
     */
    get values(): any {
        return this.value;
    }

    /**
     * Add a new model
     */
    add() {
        // do we need to initialize the list ?
        if (!this.values) {
            this.value = [];
        }

        // add new model
        this.values.push({});

        // mark as dirty
        this.control.markAsDirty();

        // validate groups & inputs
        setTimeout(() => { this.validateGroup(); });
    }

    /**
     * Remove an existing model
     */
    delete(index) {
        // show confirm dialog to confirm the action
        if (
            !_.values(this.values[index]).some(x => x !== undefined && x !== '') ||
            confirm(this.removeConfirmMsg)
        ) {
            // remove document
            this.values.splice(index, 1);

            // mark as dirty
            this.control.markAsDirty();

            // validate groups & inputs
            setTimeout(() => { this.validateGroup(); });
        }
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
