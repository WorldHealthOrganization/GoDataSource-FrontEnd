import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core';
import { AgeModel } from '../../../core/models/age.model';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import * as _ from 'lodash';
import { Constants } from '../../../core/models/constants';

/**
 * Age Types
 */
enum AgeType {
    YEARS = 'years',
    MONTHS = 'months'
}

@Component({
    selector: 'app-form-age',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-age.component.html',
    styleUrls: ['./form-age.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAgeComponent,
        multi: true
    }]
})
export class FormAgeComponent extends GroupBase<AgeModel> {
    // constants
    AgeType = AgeType;
    Constants = Constants;

    // age data
    ageTypeArray: LabelValuePair[] = [];
    _ageType: AgeType = AgeType.YEARS;
    set ageType(ageType: AgeType) {
        // set age type
        this._ageType = ageType;

        // copy value from one place to the other
        if (this.ageType === AgeType.MONTHS) {
            this.age.months = this.age.years;
            this.age.years = 0;
        } else {
            this.age.years = this.age.months;
            this.age.months = 0;
        }
    }
    get ageType(): AgeType {
        return this._ageType;
    }

    // general configurations
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() tooltip: string;

    /**
     * Years
     */
    private _yearsPlaceholder: string = 'LNG_AGE_FIELD_LABEL_YEARS';
    @Input() set yearsPlaceholder(yearsPlaceholder: string) {
        this._yearsPlaceholder = yearsPlaceholder;
        this.updateAgeTypeArray();
    }
    get yearsPlaceholder(): string {
        return this._yearsPlaceholder;
    }

    /**
     * Months
     */
    private _monthsPlaceholder: string = 'LNG_AGE_FIELD_LABEL_MONTHS';
    @Input() set monthsPlaceholder(monthsPlaceholder: string) {
        this._monthsPlaceholder = monthsPlaceholder;
        this.updateAgeTypeArray();
    }
    get monthsPlaceholder(): string {
        return this._monthsPlaceholder;
    }

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);

        // initialize
        this.updateAgeTypeArray();
    }

    /**
     * Overwrite value initializer
     * @param value
     */
    writeValue(value: AgeModel) {
        // initialize
        super.writeValue(value);

        setTimeout(() => {
            // parent handler
            super.validateGroup();
        });

        // set initial state
        if (
            value &&
            value.months > 0
        ) {
            // change age type without resetting value - ( DON'T use setter )
            this._ageType = AgeType.MONTHS;
        }
    }

    /**
     * Age Model
     */
    get age(): AgeModel {
        if (this.value && this.value.months > 0) {
            this._ageType = AgeType.MONTHS;
        } else {
            this._ageType = AgeType.YEARS;
        }

        // finished
        return this.value ?
            this.value :
            new AgeModel();
    }

    /**
     * Update Age Types Array
     */
    updateAgeTypeArray() {
        this.ageTypeArray = [
            new LabelValuePair(
                this.yearsPlaceholder,
                AgeType.YEARS
            ),
            new LabelValuePair(
                this.monthsPlaceholder,
                AgeType.MONTHS
            )
        ];
    }

    /**
     * Change value
     * @param key
     * @param value
     */
    onChangeNo(key: string, value: string | number) {
        // do we need to change value ?
        this.age[key] = _.isString(value) ?
            parseFloat(value as string) :
            value;

        setTimeout(() => {
            // parent handler
            super.onChange();
        });
    }

    /**
     * Change type (Years / Months)
     */
    onChangeType() {
        setTimeout(() => {
            // parent handler
            super.onChange();
        });
    }
}
