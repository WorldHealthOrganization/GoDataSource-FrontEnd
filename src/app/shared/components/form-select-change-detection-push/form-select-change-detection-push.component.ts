import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    EventEmitter,
    Output,
    HostBinding,
    ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import * as _ from 'lodash';
import { ElementBase } from '../../xt-forms/core';

@Component({
    selector: 'app-form-select-change-detection-push',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select-change-detection-push.component.html',
    styleUrls: ['./form-select-change-detection-push.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectChangeDetectionPushComponent,
        multi: true
    }],

    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormSelectChangeDetectionPushComponent extends ElementBase<string | string[]> {
    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() multiple: boolean = false;
    @Input() options: any[];
    @Input() optionLabelKey: string = 'label';
    @Input() optionLabelPrefixKey: string = null;
    @Input() optionValueKey: string = 'value';
    @Input() clearable: boolean = true;
    @Input() noneLabel: string = 'LNG_COMMON_LABEL_NONE';

    @Output() optionChanged = new EventEmitter<any>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        protected changeDetectorRef: ChangeDetectorRef
    ) {
        super(controlContainer, validators, asyncValidators);

        // listen for changes
        this.registerOnChange(() => {
            this.markForCheck();
        });
    }

    /**
     * Handle changes
     */
    markForCheck() {
        this.changeDetectorRef.markForCheck();
    }

    /**
     * Validate & check for changes
     */
    validateAndMarkForCheck() {
        // detect changes
        this.validate();
        setTimeout(() => {
            this.markForCheck();
        });
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        // touch
        this.touch();

        // detect changes
        this.markForCheck();
    }

    /**
     * Set value from select option
     * @param {string} value
     */
    writeValue(value: string) {
        // send data further
        super.writeValue(value);

        // detect changes
        this.markForCheck();
    }

    /**
     * Function triggered when the selected value is changed
     * @param selectedValue The new value that has been selected
     */
    onChange() {
        setTimeout(() => {
            // note that this could be a single or a multi select
            let selectedOptions = _.filter(this.options, (option) => {
                if (!_.isArray(this.value)) {
                    // single select
                    return option[this.optionValueKey] === this.value;
                } else {
                    // multi select
                    return this.value.indexOf(option[this.optionValueKey]) >= 0;
                }
            });

            // clone the selected options so we don't affect the Options list
            selectedOptions = _.cloneDeep(selectedOptions);

            if (!this.multiple) {
                // single select; keep only the first option that was found
                selectedOptions = selectedOptions[0];
            }

            // emit the currently selected option(s)
            this.optionChanged.emit(selectedOptions);
        });

        // detect changes
        this.validateAndMarkForCheck();
    }
}
