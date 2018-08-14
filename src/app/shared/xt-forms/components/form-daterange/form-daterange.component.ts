import { Component, Host, Inject, Input, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { GroupBase } from '../../core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRangeModel } from '../../../../core/models/date-range.model';

@Component({
    selector: 'app-form-daterange',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-daterange.component.html',
    styleUrls: ['./form-daterange.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDaterangeComponent,
        multi: true
    }]
})

export class FormDaterangeComponent extends GroupBase<DateRangeModel> {

    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    // start date
    private _startDateVisible: boolean = true;
    @Input() set startDateVisible(value: boolean) {
        this._startDateVisible = value;
        if (!this._startDateVisible) {
            this.dateRange.startDate = null;
        }
    }
    get startDateVisible(): boolean {
        return this._startDateVisible;
    }

    // end date
    private _endDateVisible: boolean = true;
    @Input() set endDateVisible(value: boolean) {
        this._endDateVisible = value;
        if (!this._endDateVisible) {
            this.dateRange.endDate = null;
        }
    }
    get endDateVisible(): boolean {
        return this._endDateVisible;
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);

        // init value
        this.value = new DateRangeModel(this.value);
    }

    /**
     * In this case value always needs to be a DateRangeModel
     * @param {DateRangeModel} value
     */
    writeValue(value: DateRangeModel) {
        // in this case we always need to handle an object since we always bind further the properties of this object ( startDate & endDate )
        if (!value) {
            value = new DateRangeModel(value);
        }

        // let parent handle the binding value
        super.writeValue(value);
    }

    /**
     * DateRange Model
     */
    get dateRange(): DateRangeModel {
        return this.value;
    }
}


