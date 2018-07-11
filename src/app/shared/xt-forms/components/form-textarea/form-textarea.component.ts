import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, HostBinding, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core/index';

@Component({
    selector: 'app-form-textarea',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-textarea.component.html',
    styleUrls: ['./form-textarea.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormTextareaComponent,
        multi: true
    }]
})
export class FormTextareaComponent extends ElementBase<string> {

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;

    @Input() maxlength: number;

    @Output() optionChanged = new EventEmitter<any>();

    public identifier = `form-textarea-${identifier++}`;

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

    /**
     * Function triggered when the input value is changed
     */
    onChange() {
        // emit the current value
        return this.optionChanged.emit(this.value);
    }
}

let identifier = 0;
