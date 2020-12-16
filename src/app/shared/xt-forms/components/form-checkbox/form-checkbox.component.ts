import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    HostBinding,
    Output,
    EventEmitter,
    OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core/index';

@Component({
    selector: 'app-form-checkbox',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-checkbox.component.html',
    styleUrls: ['./form-checkbox.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormCheckboxComponent,
        multi: true
    }]
})
export class FormCheckboxComponent extends ElementBase<boolean> implements OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() label: string;
    // used only when checkbox element is "readonly" and not checked
    @Input() notCheckedLabel: string;
    @Input() name: string;
    @Input() labelBefore: boolean;
    @Input() readonly: boolean = false;
    @Input() disabled: boolean = false;
    @Input() disableRipple: boolean = true;

    public identifier = `form-checkbox-${FormCheckboxComponent.identifier++}`;

    @Output() optionChanged = new EventEmitter<any>();
    @Output() afterInitialize = new EventEmitter<any>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        return this.afterInitialize.emit();
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onClick() {
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
