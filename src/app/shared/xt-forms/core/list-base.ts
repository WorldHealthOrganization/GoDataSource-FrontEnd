import { EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '@angular/forms';
import { GroupValidator } from './group-validator';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

/**
 * Base class to be extended by components that implement lists of group components or single components
 */
export abstract class ListBase<T> extends GroupValidator<T[]> {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `list-${ListBase._identifier++}`;

    // group input name
    @Input() name: string;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T[]>();

    // allow each component to decide if we need to display a confirmation dialog or just remove it
    @Output() deleteConfirm = new EventEmitter<T[]>();

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
     * Model array
     */
    get values(): any {
        return this.value;
    }

    /**
     * Add a new model
     */
    add(newItem: T = {} as T) {
        // do we need to initialize the list ?
        if (!this.values) {
            this.value = [];
        }

        // add new model
        this.values.push(newItem);

        // mark as dirty
        this.control.markAsDirty();

        // validate groups & inputs
        setTimeout(() => {
            // validate
            this.validateGroup();

            // call on change
            this.changed.emit(this.value);
        });
    }

    /**
     * Clone item and add it to list
     * @param {T} item
     */
    clone(item: T) {
        this.add(_.cloneDeep(item));
    }

    /**
     * Remove an existing model
     */
    delete(index, overrideConfirm: boolean = false) {
        // delete method
        const deleteItem = () => {
            // remove document
            this.values.splice(index, 1);

            // mark as dirty
            this.control.markAsDirty();

            // validate groups & inputs
            setTimeout(() => {
                // validate
                this.validateGroup();

                // call on change
                this.changed.emit(this.value);
            });
        };

        // show confirm dialog to confirm the action
        if (!_.values(this.values[index]).some(x => x !== undefined && x !== '') || overrideConfirm ) {
            deleteItem();
        } else {
            Observable.create((observer) => {
                this.deleteConfirm.emit(observer);
            }).subscribe(() => {
                deleteItem();
            });
        }
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange(validateGroup: boolean = true) {
        // validate group
        if (validateGroup) {
            super.validateGroup();
        }

        // mark as dirty
        if (this.control) {
            this.control.markAsDirty();
        }

        // call changed event
        this.changed.emit(this.value);
    }
}
