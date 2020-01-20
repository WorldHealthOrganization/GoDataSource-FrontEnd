import { Component, Host, HostBinding, Inject, Input, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { GroupBase } from '../../core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRangeModel } from '../../../../core/models/date-range.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import * as momentOriginal from 'moment';

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

    @Input() fromTooltip: string;
    @Input() toTooltip: string;

    @Input() minDate: Moment;
    @Input() maxDate: Moment;

    @HostBinding('class.form-element-host') isFormElement = true;

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

    /**
     * Return dates for dateSameOrAfter directive
     * @returns {Array}
     */
    getDateSameOrAfter(name: string) {
        const dates = [];
        // if start date is visible
        if (this.startDateVisible) {
            dates.push(name + '[startDate]');
        }

        // case we have min date
        if (this.minDate) {
            dates.push(this.minDate);
        }

        return dates;
    }

    /**
     * Return dates for dateSameOrBefore
     * @param {string} name
     * @returns {Array}
     */
    getDateSameOrBefore(name: string) {
        const dates = [];
        // if end date is visible
        if (this.endDateVisible) {
            dates.push(name + '[endDate]');
        }

        // if we have max date
        if (this.maxDate) {
            dates.push(this.maxDate);
        }

        return dates;
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange(validateGroup: boolean = true) {
        // wait for bindings to take effect
        setTimeout(() => {
            // do we need to replace start date time with start of the day?
            if (
                this.dateRange.startDate && (
                    !(this.dateRange.startDate instanceof momentOriginal) ||
                    !(this.dateRange.startDate as Moment).isSame((this.dateRange.startDate as Moment).startOf('day'))
                )
            ) {
                this.dateRange.startDate = moment(this.dateRange.startDate).startOf('day');
            }

            // do we need to replace end date time with end of the day?
            if (
                this.dateRange.endDate && (
                    !(this.dateRange.endDate instanceof momentOriginal) ||
                    !(this.dateRange.endDate as Moment).isSame((this.dateRange.endDate as Moment).endOf('day'))
                )
            ) {
                this.dateRange.endDate = moment(this.dateRange.endDate).endOf('day');
            }

            // trigger parent
            super.onChange(validateGroup);
        });
    }
}


