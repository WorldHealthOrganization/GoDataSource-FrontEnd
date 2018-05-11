import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core';

@Component({
    selector: 'app-form-input',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-input.component.html',
    styleUrls: ['./form-input.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormInputComponent,
        multi: true
    }]
})
export class FormInputComponent extends ElementBase<string> {

    @Input() placeholder: string;
    @Input() type: string = 'text';
    @Input() required: any = false;
    @Input() name: string;

    public identifier = `form-input-${identifier++}`;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }
}

let identifier = 0;
