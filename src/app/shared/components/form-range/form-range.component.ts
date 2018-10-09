import { GroupBase } from '../../xt-forms/core/group-base';
import { Component, Host, HostBinding, Inject, Input, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
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

    @Input() step: number = 1;
    @Input() min: number;
    @Input() max: number;

    @Input() fromPlaceholder: string = 'LNG_FORM_RANGE_FIELD_LABEL_FROM';
    @Input() toPlaceholder: string = 'LNG_FORM_RANGE_FIELD_LABEL_TO';

    // from
    private _fromVisible: boolean = true;
    @Input() set fromVisible(value: boolean) {
        this._fromVisible = value;
        if (!this._fromVisible) {
            this.range.from = null;
        }
    }
    get fromVisible(): boolean {
        return this._fromVisible;
    }

    // to
    private _toVisible: boolean = true;
    @Input() set toVisible(value: boolean) {
        this._toVisible = value;
        if (!this._toVisible) {
            this.range.to = null;
        }
    }
    get toVisible(): boolean {
        return this._toVisible;
    }

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
     * In this case value always needs to be a FormRangeModel
     * @param {FormRangeModel} value
     */
    writeValue(value: FormRangeModel) {
        // in this case we always need to handle an object since we always bind further the properties of this object ( from & to )
        if (!value) {
            value = new FormRangeModel(value);
        }

        // let parent handle the binding value
        super.writeValue(value);
    }

    /**
     * Model
     */
    get range(): FormRangeModel {
        // finished
        return this.value;
    }

    /**
     * Handle on change
     * @param validateGroup
     */
    onChange(validateGroup: boolean = true) {
        // format values
        if (this.range) {
            if (this.range.from) { this.range.from = Number(this.range.from); }
            if (this.range.to) { this.range.to = Number(this.range.to); }
        }

        // parent
        super.onChange(validateGroup);
    }
}
