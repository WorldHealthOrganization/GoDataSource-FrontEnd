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
    EventEmitter
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';

@Component({
    selector: 'app-form-icon-picker',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-icon-picker.component.html',
    styleUrls: ['./form-icon-picker.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormIconPickerComponent,
        multi: true
    }]
})
export class FormIconPickerComponent
    extends ElementBase<string> {

    // element configure
    @HostBinding('class.form-element-host') isFormElement = true;

    // input
    @Input() placeholder: string;
    @Input() name: string;
    @Input() disabled: boolean = false;

    // output
    @Output() blur = new EventEmitter<any>();

    // icon pack
    ipIconPack: string[] = [
        'mat'
    ];

    /**
     * Constructor
     */
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
        this.blur.emit(this.value);
    }

    /**
     * Icon changed
     */
    iconPickerSelect(icon: string): void {
        // hack to not set the default icon
        let realValue = icon ?
            icon.trim() :
            icon;
        realValue = realValue ?
            realValue :
            undefined;

        // update value
        if (this.value !== realValue) {
            this.value = realValue;
        }
    }

    /**
     * Remove icon
     */
    removeIcon(): void {
        if (this.value) {
            this.value = null;
        }
    }
}
