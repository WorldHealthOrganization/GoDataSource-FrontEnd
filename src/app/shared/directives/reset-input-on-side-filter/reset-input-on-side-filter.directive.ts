import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { FormLocationDropdownComponent } from '../../components/form-location-dropdown/form-location-dropdown.component';

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

@Directive({
    selector: '[app-reset-location-on-side-filter]'
})
export class ResetLocationOnSideFilterDirective {
    private pristineValue: any = undefined;

    @Input() resetToPristineValue: boolean = true;

    constructor(
        private component: FormLocationDropdownComponent
    ) {
        setTimeout(() => {
            this.pristineValue = component.value;
        });
    }

    public reset() {
        this.component.value = this.resetToPristineValue ? this.pristineValue : undefined;
        if (!this.component.value) {
            this.component.addLocationConditionAndRefresh();
        }
    }
}
