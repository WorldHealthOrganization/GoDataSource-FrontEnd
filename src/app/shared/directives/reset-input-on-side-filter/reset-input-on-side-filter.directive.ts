import { Directive } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[app-reset-input-on-side-filter]'
})
export class ResetInputOnSideFilterDirective {
    constructor(
        private control: NgControl
    ) {}

    public reset() {
        this.control.reset();
    }
}
