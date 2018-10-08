import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, ViewChild, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core';
import { CaseModel } from '../../../core/models/case.model';
import { ContactModel } from '../../../core/models/contact.model';
import { FormDatepickerComponent } from '../../xt-forms/components/form-datepicker/form-datepicker.component';
import { FormAgeComponent } from '../form-age/form-age.component';
import { Moment } from 'moment';
import { AgeModel } from '../../../core/models/age.model';
import { Constants } from '../../../core/models/constants';

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

    ageSelected: boolean = true;

    today: Moment;

    @ViewChild('dob') dobComponent: FormDatepickerComponent;
    dobDirty: boolean = false;
    @ViewChild('age') ageComponent: FormAgeComponent;
    ageDirty: boolean = false;

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
        // save control dirty state since ngIf removes it...and we can't use fxShow / Hide since it doesn't reinitialize component & rebind values
        if (this.ageSelected) {
            this.ageDirty = this.ageComponent && this.ageComponent.control.dirty;
        } else {
            this.dobDirty = this.dobComponent && this.dobComponent.control.dirty;
        }

        // switch element that we want to see
        this.ageSelected = ageSelected;

        // make sure we set dirtiness back
        setTimeout(() => {
            // make control dirty again
            if (
                this.ageSelected &&
                this.ageDirty &&
                this.ageComponent
            ) {
                // make sure we have control
                setTimeout(() => {
                    this.ageComponent.control.markAsDirty();
                });
            } else if (
                !this.ageSelected &&
                this.dobDirty &&
                this.dobComponent
            ) {
                // make sure we have control
                setTimeout(() => {
                    this.dobComponent.control.markAsDirty();
                });
            }
        });
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
        AgeModel.addAgeFromDob(
            this.value,
            dob,
            date
        );

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


