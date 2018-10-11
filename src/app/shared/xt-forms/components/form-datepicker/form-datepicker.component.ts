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
    EventEmitter
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { Constants } from '../../../../core/models/constants';
import { ElementBase } from '../../core/index';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Moment } from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';

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
export class FormDatepickerComponent extends ElementBase<string> {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;

    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;

    @Input() maxDate: string | Moment;
    @Input() minDate: string | Moment;

    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;

        // fix for missing from language... ( e.g. english has it, japanese doesn't.. this will display all new tokens... )
        this._tooltip = this._tooltip && this._tooltip.startsWith('LNG_') ? '' : this._tooltip;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    public identifier = `form-datepicker-${FormDatepickerComponent.identifier++}`;

    @Output() optionChanged = new EventEmitter<any>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);

        // on language change..we need to translate again the token
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.tooltip = this._tooltipToken;
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
