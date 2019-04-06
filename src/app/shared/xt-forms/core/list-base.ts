import { EventEmitter, Host, Inject, Input, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '@angular/forms';
import { GroupValidator } from './group-validator';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

/**
 * Base class to be extended by components that implement lists of group components or single components
 */
export abstract class ListBase<T> extends GroupValidator<T[]> {
    static _identifier: number = 0;

    // element unique ID
    public identifier: string = `list-${ListBase._identifier++}`;

    // group input name
    @Input() name: string;

    // limits
    @Input() minItems: number = 0;

    // handler for when one of the group value has changed
    @Output() changed = new EventEmitter<T[]>();

    // allow each component to decide if we need to display a confirmation dialog or just remove it
    @Output() deleteConfirm = new EventEmitter<any>();

    /**
     * Constructor
     */
    protected constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        // parent
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Model array
     */
    get values(): any {
        return this.value;
    }

    /**
     * Create new item
     */
    protected generateNewItem(): T {
        return {} as T;
    }

    /**
     * Handle minimum number of items from the list
     * @param value
     */
    writeValue(value: T[]) {
        // add minimum number of items to the list ?
        const valuesArray = value ? value : [];
        while (valuesArray.length < this.minItems) {
            valuesArray.push(this.generateNewItem());
        }

        // write value
        super.writeValue(valuesArray);
    }

    /**
     * Add a new model
     */
    add(newItem: T | T[] = null) {
        // do we need to initialize the list ?
        if (!this.values) {
            this.value = [];
        }

        // do we need to generate new item ?
        if (newItem === null) {
            newItem = this.generateNewItem();
        }

        // add new model
        if (_.isArray(newItem)) {
            (newItem as T[]).forEach((item: T) => {
                this.values.push(item);
            });
        } else {
            this.values.push(newItem);
        }

        // trigger change
        this.onChange();
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
            // remove item
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

        // are we allowed to remove this item ?
        // if not there is no point in continuing
        if ((this.values as any[]).length <= this.minItems) {
            return;
        }

        // show confirm dialog to confirm the action
        if (!_.values(this.values[index]).some(x => x !== undefined && x !== '') || overrideConfirm ) {
            deleteItem();
        } else {
            new Observable((observer) => {
                this.deleteConfirm.emit(observer);
            }).subscribe(() => {
                deleteItem();
            });
        }
    }

    /**
     * Remove all items from the list
     */
    clear() {
        // if the list is already empty there is no point in clearing it
        if (
            !this.values ||
            this.values.length < 1
        ) {
            return;
        }

        // clear array of items
        this.value = [];

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
     * Function triggered when the input value is changed
     */
    onChange(validateGroup: boolean = true) {
        // validate group
        if (validateGroup) {
            // validate groups & inputs
            setTimeout(() => {
                super.validateGroup();
            });
        }

        // mark as dirty
        if (this.control) {
            this.control.markAsDirty();
        }

        // call changed event
        this.changed.emit(this.value);
    }
}
