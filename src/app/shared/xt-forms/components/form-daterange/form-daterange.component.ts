import { Component, Host, Inject, Input, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
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

export class FormDaterangeComponent extends GroupBase<DateRangeModel> implements OnInit {

    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {

        // init value
        this.value = new DateRangeModel();
    }

    /**
     * DateRange Model
     */
    get dateRange(): DateRangeModel {
        return this.value;
    }
}


