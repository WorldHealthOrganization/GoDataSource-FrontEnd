import { ElementBase } from './element-base';
import { EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '@angular/forms';

/**
 * Base class to be extended by custom form controls to handle groups of atomic form components
 */
export abstract class GroupBase<T> extends ElementBase<T> {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `group-${GroupBase._identifier++}`;

    // group input name
    @Input() name: string;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T>();

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
        return this.changed.emit(this.value);
    }
}
