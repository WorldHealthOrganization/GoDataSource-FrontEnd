import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core';
import { CaseModel } from '../../../core/models/case.model';
import { ContactModel } from '../../../core/models/contact.model';
import { FormDatepickerComponent } from '../../xt-forms/components/form-datepicker/form-datepicker.component';
import { Moment } from 'moment';
import { AgeModel } from '../../../core/models/age.model';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';

@Component({
    selector: 'app-form-age-dob',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-age-dob.component.html',
    styleUrls: ['./form-age-dob.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAgeDobComponent,
        multi: true
    }]
})
export class FormAgeDobComponent extends GroupBase<CaseModel | ContactModel> implements OnInit {
    // general configurations
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() ageButtonLabel: string;
    @Input() ageTooltip: string;
    @Input() dobButtonLabel: string;
    @Input() dobPlaceholder: string;
    @Input() dobTooltip: string;

    ageSelected: boolean = true;

    today: Moment;

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
     * Component initialized
     */
    ngOnInit() {
        this.today = Constants.getCurrentDate();
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        // switch element that we want to see
        this.ageSelected = ageSelected;
    }

    /**
     * Overwrite value initializer
     * @param value
     */
    writeValue(value: CaseModel | ContactModel) {
        // initialize
        super.writeValue(value);

        // set initial state
        if (value) {
            this.ageSelected = !value.dob;
        }
    }

    /**
     * Age & Dob handler
     */
    get ageDob(): any {
        return this.value ?
            this.value :
            {};
    }

    /**
     * DOB changed handler
     * @param dob
     * @param date
     */
    dobChanged(
        dob: FormDatepickerComponent,
        date: Moment
    ) {
        // update age
        if (
            (
                !dob ||
                !dob.invalid
            ) &&
            date &&
            date.isValid()
        ) {
            // add age object if we don't have one
            if (!this.ageDob.age) {
                this.ageDob.age = new AgeModel();
            }

            // add data
            const now = moment();
            this.ageDob.age.years = now.diff(date, 'years');
            this.ageDob.age.months = this.ageDob.age.years < 1 ? now.diff(date, 'months') : 0;
        } else {
            this.ageDob.age.months = 0;
            this.ageDob.age.years = 0;
        }

        // tell parent that data changed
        super.onChange();
    }

    /**
     * Age changed
     */
    ageChanged() {
        // reset dob if we change number of months
        this.ageDob.dob = null;

        // tell parent that data changed
        super.onChange();
    }
}


