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
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-form-radio',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-radio.component.html',
    styleUrls: ['./form-radio.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormRadioComponent,
        multi: true
    }]
})
export class FormRadioComponent extends ElementBase<string> implements OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() label: string;
    @Input() name: string;
    @Input() options: LabelValuePair[];
    @Input() disabled: boolean = false;
    @Input() tooltip: string = null;

    public identifier = `form-radio-${FormRadioComponent.identifier++}`;

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
