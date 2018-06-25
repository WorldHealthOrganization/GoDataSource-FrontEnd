import { GroupBase } from '../../xt-forms/core/group-base';
import { Component, Host, HostBinding, Inject, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormRangeModel } from './form-range.model';

@Component({
    selector: 'app-form-range',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-range.component.html',
    styleUrls: ['./form-range.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormRangeComponent,
        multi: true
    }]
})
export class FormRangeComponent extends GroupBase<FormRangeModel> {
    @HostBinding('class.form-element-host') isFormElement = true;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        // init parent
        super(controlContainer, validators, asyncValidators);

        // init value
        this.value = new FormRangeModel(this.value);
    }

    /**
     * Model
     */
    get range(): FormRangeModel {
        // finished
        return this.value;
    }
}
