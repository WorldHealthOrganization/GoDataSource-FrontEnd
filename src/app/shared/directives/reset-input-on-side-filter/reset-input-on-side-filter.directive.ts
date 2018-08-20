import { Directive } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[app-reset-input-on-side-filter]'
})
export class ResetInputOnSideFilterDirective {
    private pristineValue: any = undefined;

    constructor(
        private control: NgControl
    ) {
        setTimeout(() => {
            this.pristineValue = control.value;
        });
    }

    public reset() {
        this.control.reset(this.pristineValue);
    }
}
