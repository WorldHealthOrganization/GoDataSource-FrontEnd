import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[app-reset-input-on-side-filter]'
})
export class ResetInputOnSideFilterDirective {
    private pristineValue: any = undefined;

    @Input() resetToPristineValue: boolean = true;

    constructor(
        private control: NgControl
    ) {
        setTimeout(() => {
            this.pristineValue = control.value;
        });
    }

    public reset() {
        this.control.reset(this.resetToPristineValue ? this.pristineValue : undefined);
    }
}
