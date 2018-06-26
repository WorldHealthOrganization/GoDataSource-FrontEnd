import { ElementBase } from './element-base';
import { Host, Inject, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NgForm } from '@angular/forms';

/**
 * Base class to be extended by custom form controls to handle groups of atomic form components
 */
export abstract class GroupValidator<T> extends ElementBase<T> {
    // Group Form
    @ViewChild('groupForm') groupForm: NgForm;

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
     * Check if any of the group children is invalid
     */
    public validateGroup() {
        // check if we have invalid children
        if (this.control) {
            if (
                this.groupForm &&
                this.groupForm.controls
            ) {
                // clear errors
                let valid: boolean = true;
                for (const name in this.groupForm.controls) {
                    // right now we don't need to keep children errors since we won't display group errors anywhere
                    // since we don't need all children errors we can stop
                    if (this.groupForm.controls[name].invalid) {
                        // invalid
                        valid = false;

                        // we can stop since we don't need all errors
                        break;
                    }
                }

                // so at this point we would add a dummy error & there is no point in continuing to check the rest of the children
                if (valid) {
                    this.control.setErrors(null);
                } else {
                    this.control.setErrors({groupInvalid: true});
                }
            } else {
                this.control.setErrors(null);
            }
        }
    }
}
