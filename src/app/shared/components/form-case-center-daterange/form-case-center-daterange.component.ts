import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase, GroupFilteredValue } from '../../xt-forms/core';
import { CaseCenterDateRangeModel } from '../../../core/models/case-center-date-range.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { Observable } from 'rxjs';
import { Moment } from '../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-form-case-center-daterange',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-case-center-daterange.component.html',
    styleUrls: ['./form-case-center-daterange.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormCaseCenterDaterangeComponent,
        multi: true
    }]
})
export class FormCaseCenterDaterangeComponent extends GroupBase<CaseCenterDateRangeModel> implements OnInit, GroupFilteredValue<any> {
    dateTypeList$: Observable<any>;

    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() minDate: Moment;
    @Input() maxDate: Moment;

    @Input() fromTooltip: string;
    @Input() toTooltip: string;
    @Input() centerNameLabel: string;
    @Input() centerNameTooltip: string;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        this.value = new CaseCenterDateRangeModel(this.value);
        this.dateTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PERSON_DATE_TYPE);
    }

    /**
     * CenterDateRange Model
     */
    get centerDateRange(): CaseCenterDateRangeModel {
        return this.value ? this.value : {} as CaseCenterDateRangeModel;
    }
    set centerDateRange(value: CaseCenterDateRangeModel) {
        this.value = value;
    }

    /**
     * Get Filtered Value
     */
    getFilteredValue(): any {
        // strip unnecessary data
        return this.value ?
            new CaseCenterDateRangeModel(this.centerDateRange).sanitize() :
            this.value;
    }
}
