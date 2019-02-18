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
import { MatSliderChange } from '@angular/material';
import { Constants } from '../../../../core/models/constants';

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
export class FormDateSliderComponent extends ElementBase<Moment> {
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
     * Display date
     */
    @Input() displayValue: string = 'LNG_FORM_DATE_SLIDER_FIELD_LABEL_VALUE';

    /**
     * Min Date
     */
    private _minDate: Moment;
    public minDateLabel: string;
    @Input() set minDate(minDate: Moment) {
        // set min date
        this._minDate = !minDate ? null : (
            minDate instanceof moment ? minDate : moment(minDate)
        ) as Moment;

        // set label
        this.minDateLabel = minDate ? minDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '';

        // determine min & max
        this.determineMinMax();
    }
    get minDate(): Moment {
        return this._minDate;
    }

    /**
     * Max Date
     */
    private _maxDate: Moment;
    public maxDateLabel: string;
    public maxValue: number = 0;
    @Input() set maxDate(maxDate: Moment) {
        // set max date
        this._maxDate = !maxDate ? null : (
            maxDate instanceof moment ? maxDate : moment(maxDate)
        ) as Moment;

        // set label
        this.maxDateLabel = maxDate ? maxDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '';

        // determine min & max
        this.determineMinMax();
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
     * Slider value
     */
    public sliderValue: number = 0;

    /**
     * Slider date value
     */
    public sliderDateData: {
        date: string
    };

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

        // handle value changes
        this.registerOnChange(() => {
            this.determineSliderValue();
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
    onInput(sliderChange: MatSliderChange) {
        // we need to have minDate to determine date
        if (!this.minDate) {
            return;
        }

        // determine date accordingly to the new slider value
        // we need to clone minDate since add alters the object
        this.value = moment(this.minDate).add(sliderChange.value, 'days');
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange(sliderChange: MatSliderChange) {
        // trigger on input to determine value
        this.onInput(sliderChange);

        // emit the current value
        this.optionChanged.emit(this.value);
    }

    /**
     * Determine min & max
     */
    private determineMinMax() {
        // we can do this only if we have min & max dates
        if (
            !this.minDate ||
            !this.maxDate ||
            this.maxDate.isSameOrBefore(this.minDate)
        ) {
            // set max value to zero since we can't determine the proper number of days between max & min dates
            this.maxValue = 0;

            // determine slider value
            this.determineSliderValue();

            // finished
            return;
        }

        // determine min & max
        // min should always be zero
        // we need to clone minDate since add alters the object
        this.maxValue = moment(this.maxDate).diff(this.minDate, 'days');

        // determine slider value
        this.determineSliderValue();
    }

    /**
     * Write value
     * @param value
     */
    writeValue(value: Moment) {
        // write value
        value = !value ? null : (
            value instanceof moment ? value : moment(value)
        ) as Moment;
        super.writeValue(value);

        // determine slider value
        this.determineSliderValue();
    }

    /**
     * Determine slider value
     */
    private determineSliderValue() {
        // determine slider value
        if (
            this.value &&
            this.minDate &&
            this.maxDate &&
            this.maxDate.isAfter(this.minDate) &&
            this.value.isBetween(this.minDate, this.maxDate, null, '[]')
        ) {
            // we need min & max dates to determine slider value
            this.sliderValue = moment(this.value).diff(this.minDate, 'days');
        } else {
            // value not set
            this.sliderValue = 0;
        }

        // set date label
        if (this.value) {
            this.sliderDateData = {
                date: this.value.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
            };
        }
    }
}
