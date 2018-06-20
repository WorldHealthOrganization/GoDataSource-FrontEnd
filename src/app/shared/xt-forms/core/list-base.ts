import { EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '@angular/forms';
import { ElementBase } from './element-base';

import * as _ from 'lodash';

/**
 * Base class to be extended by components that implement lists of group components or single components
 */
export abstract class ListBase<T> extends ElementBase<T[]> {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `group-${ListBase._identifier++}`;

    // group input name
    @Input() name: string;

    // converts value to something else
    @Input() valueMap;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T>();

    @Input() removeConfirmMsg: string = 'Are you sure you want to delete this item?';
    @Input() viewOnly: boolean = false;

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
        }
    }
}
