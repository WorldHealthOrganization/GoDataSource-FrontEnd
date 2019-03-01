import {
    Component,
    Input,
    ViewEncapsulation,
    Inject,
    Host,
    SkipSelf,
    HostBinding,
    Optional
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';

@Component({
    selector: 'app-form-hidden-input',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-hidden-input.component.html',
    styleUrls: ['./form-hidden-input.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormHiddenInputComponent,
        multi: true
    }]
})
export class FormHiddenInputComponent extends ElementBase<string> {
    static identifier: number = 0;
    public identifier = `form-input-${FormHiddenInputComponent.identifier++}`;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() required: boolean = false;
    @Input() name: string;

    // used to display form errors
    @Input() placeholder: string;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }
}
