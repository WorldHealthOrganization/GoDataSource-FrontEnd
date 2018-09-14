import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    HostBinding,
    Output,
    EventEmitter,
    OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { Constants } from '../../../../core/models/constants';
import { ElementBase } from '../../core/index';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Moment } from 'moment';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';

// Define format to be used into datepicker
export const DEFAULT_FORMAT = {
    parse: {
        dateInput: Constants.DEFAULT_DATE_DISPLAY_FORMAT
    },
    display: {
        dateInput: Constants.DEFAULT_DATE_DISPLAY_FORMAT,
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
    }
};

@Component({
    selector: 'app-form-datepicker',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-datepicker.component.html',
    styleUrls: ['./form-datepicker.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDatepickerComponent,
        multi: true
    },
        // tried adding a custom adapter for validations, but the system wasn't picking up the issue and there was no way to set a validation error message
        // this is way we implemented a custom validator directive
       { provide: DateAdapter, useClass: MomentDateAdapter },
       { provide: MAT_DATE_FORMATS, useValue: DEFAULT_FORMAT }
    ]
})
export class FormDatepickerComponent extends ElementBase<string> implements OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;

    @Input() maxDate: string | Moment;
    @Input() minDate: string | Moment;
    @Input() tooltip: string = null;

    public identifier = `form-datepicker-${FormDatepickerComponent.identifier++}`;

    @Output() optionChanged = new EventEmitter<any>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        const labelValue = _.camelCase(this.i18nService.instant(this.placeholder)).toLowerCase();
        this.referenceDataDataService.getGlossaryItems().subscribe((glossaryData) => {
            this.tooltip = _.isEmpty(glossaryData[labelValue]) ? null : this.i18nService.instant(glossaryData[labelValue]);
        });
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange() {
        // emit the current value
        // wait for binding to occur
        setTimeout(() => {
            this.optionChanged.emit(this.value);
        });
    }
}
