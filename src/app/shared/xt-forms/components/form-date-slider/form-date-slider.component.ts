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
import { ElementBase } from '../../core/index';
import { Moment } from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as moment from 'moment';

@Component({
    selector: 'app-form-date-slider',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-date-slider.component.html',
    styleUrls: ['./form-date-slider.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDateSliderComponent,
        multi: true
    }]
})
export class FormDateSliderComponent extends ElementBase<string> {
    /**
     * Component identifier
     */
    static identifier: number = 0;

    /**
     * Form element
     */
    @HostBinding('class.form-element-host') isFormElement = true;

    /**
     * Label
     */
    @Input() label: string;

    /**
     * Disabled
     */
    @Input() disabled: boolean = false;

    /**
     * Name
     */
    @Input() name: string;

    /**
     * Min Date
     */
    private _minDate: Moment;
    @Input() set minDate(minDate: Moment) {
        this._minDate = !minDate ? null : (
            minDate instanceof moment ? minDate : moment(minDate)
        ) as Moment;
    }
    get minDate(): Moment {
        return this._minDate;
    }

    /**
     * Max Date
     */
    private _maxDate: Moment;
    @Input() set maxDate(maxDate: Moment) {
        this._maxDate = !maxDate ? null : (
            maxDate instanceof moment ? maxDate : moment(maxDate)
        ) as Moment;
    }
    get maxDate(): Moment {
        return this._maxDate;
    }

    /**
     * Tooltip
     */
    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    /**
     * Component id
     */
    public identifier = `form-date-slider-${FormDateSliderComponent.identifier++}`;

    /**
     * Value Changed
     */
    @Output() optionChanged = new EventEmitter<any>();

    /**
     * Constructor
     */
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
