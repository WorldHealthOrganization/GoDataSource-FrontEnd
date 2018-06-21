import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, EventEmitter, Output, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core/index';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-select',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select.component.html',
    styleUrls: ['./form-select.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectComponent,
        multi: true
    }]
})
export class FormSelectComponent extends ElementBase<string> {

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() multiple: boolean = false;
    @Input() options: any[];
    @Input() optionLabelKey: string = 'label';
    @Input() optionValueKey: string = 'value';
    @Input() optionTooltipKey: string = 'tooltip';

    @Output() optionChanged = new EventEmitter<any>();

    public identifier = `form-select-${identifier++}`;

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
     * Function triggered when the selected value is changed
     * @param selectedValue The new value that has been selected
     */
    onChange(selectedValue) {
        // find the corresponding object for the selected value
        let selectedOption = _.find(this.options, (option) => {
            return option[this.optionValueKey] === selectedValue;
        });

        // clone the option so we don't affect the Options list
        selectedOption = _.cloneDeep(selectedOption);

        // emit the currently selected option
        return this.optionChanged.emit(selectedOption);
    }
}

let identifier = 0;
