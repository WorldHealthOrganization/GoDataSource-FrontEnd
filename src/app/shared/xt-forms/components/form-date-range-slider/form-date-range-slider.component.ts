import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    HostBinding, Output, EventEmitter, ViewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ChangeContext, Options } from 'ng5-slider';
import { Constants } from '../../../../core/models/constants';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import * as momentOriginal from 'moment';

/**
 * Handles filter range data
 */
export class FormDateRangeSliderData {
    low: Moment;
    high: Moment;

    /**
     * Range Data
     */
    constructor(data: {
        low: Moment,
        high: Moment
    }) {
        Object.assign(
            this,
            data
        );
    }
}

@Component({
    selector: 'app-form-date-range-slider',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-date-range-slider.component.html',
    styleUrls: ['./form-date-range-slider.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDateRangeSliderComponent,
        multi: true
    }]
})
export class FormDateRangeSliderComponent extends ElementBase<FormDateRangeSliderData> {
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
    @Input() set disabled(disabled: boolean) {
        this.setSliderOptions({
            disabled: disabled
        });
    }
    get disabled(): boolean {
        return this.sliderOptions.disabled;
    }

    /**
     * Min Range
     */
    @Input() set minRange(minRange: number) {
        this.setSliderOptions({
            minRange: minRange
        });
    }
    get minRange(): number {
        return this.sliderOptions.minRange;
    }
    /**
     * Max Range
     */
    @Input() set maxRange(maxRange: number) {
        this.setSliderOptions({
            maxRange: maxRange
        });
    }
    get maxRange(): number {
        return this.sliderOptions.maxRange;
    }

    /**
     * Name
     */
    @Input() name: string;

    /**
     * Allow Min & Max values of the slide to be changed
     */
    @Input() allowMinMaxToBeChanged: boolean = true;

    /**
     * Min Date
     */
    private _minDate: Moment;
    @Input() set minDate(minDate: Moment) {
        // set min date
        this._minDate = !minDate ? null : (
            minDate instanceof momentOriginal ? minDate : moment(minDate)
        ) as Moment;

        // set max date if smaller
        if (
            this.minDate && (
                !this.maxDate ||
                this.maxDate.isBefore(this.minDate)
            )
        ) {
            this.maxDate = moment(this.minDate);
        }

        // determine min & max
        this.determineMinMax();

        // trigger change value
        this.triggerChangeValue();
    }
    get minDate(): Moment {
        return this._minDate;
    }

    /**
     * Max Date
     */
    private _maxDate: Moment;
    @Input() set maxDate(maxDate: Moment) {
        // set max date
        this._maxDate = !maxDate ? null : (
            maxDate instanceof momentOriginal ? maxDate : moment(maxDate)
        ) as Moment;

        // set min date if smaller
        if (
            this.maxDate && (
                !this.minDate ||
                this.minDate.isAfter(this.maxDate)
            )
        ) {
            this.minDate = moment(this.maxDate);
        }

        // determine min & max
        this.determineMinMax();

        // trigger change value
        this.triggerChangeValue();
    }
    get maxDate(): Moment {
        return this._maxDate;
    }

    /**
     * Slider Element
     */
    @ViewChild('sliderElement') sliderElement;

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
    public identifier = `form-date-slider-${FormDateRangeSliderComponent.identifier++}`;

    /**
     * Value Changed
     */
    @Output() optionChanged = new EventEmitter<any>();

    /**
     * Slider value
     */
    public sliderValue: {
        low: number,
        high: number
    } = {
        low: 0,
        high: 0
    };

    /**
     * Slider configurations
     */
    public sliderOptions: Options = {
        floor: 0,
        ceil: 0,
        step: 1,
        minRange: 0,
        pushRange: true,
        showTicks: true,
        tickStep: 14,
        showTicksValues: true,
        translate: (value: number): string => {
            // others
            return this.minDate ?
                moment(this.minDate).add(value, 'days').format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                '';
        }
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
     * Function triggered when the input value is changed
     */
    onChange(
        sliderChange: ChangeContext,
        touch: boolean = true
    ) {
        // we need to have minDate to determine date
        if (
            !this.value ||
            !this.minDate
        ) {
            return;
        }

        // touched
        if (touch) {
            this.touch();
        }

        // determine date accordingly to the new slider value
        // we need to clone minDate since add alters the object
        this.value.low = moment(this.minDate).add(sliderChange.value, 'days');
        this.value.high = moment(this.minDate).add(sliderChange.highValue, 'days');

        // emit the current value
        this.optionChanged.emit(this.value);
    }

    /**
     * Set slider options
     * @param options
     */
    private setSliderOptions(options: Options) {
        this.sliderOptions = {
            ...this.sliderOptions,
            ...options
        };
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
            this.setSliderOptions({
                ceil: 0
            });

            // determine slider value
            this.determineSliderValue();

            // finished
            return;
        }

        // determine min & max
        // min should always be zero
        // we need to clone minDate since add alters the object
        this.setSliderOptions({
            ceil: moment(this.maxDate).diff(this.minDate, 'days')
        });

        // determine slider value
        this.determineSliderValue();
    }

    /**
     * Write value
     * @param value
     */
    writeValue(value: FormDateRangeSliderData) {
        // write value
        value = !value ? null : (
            value instanceof FormDateRangeSliderData ? value : new FormDateRangeSliderData(value)
        );
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
            this.value.low &&
            this.value.high &&
            this.minDate &&
            this.maxDate &&
            this.maxDate.isAfter(this.minDate)
        ) {
            // we need min & max dates to determine slider value
            // LOW
            if (this.value.low.isBefore(this.minDate)) {
                this.sliderValue.low = 0;
            } else if (this.value.low.isAfter(this.maxDate)) {
                this.sliderValue.low = this.sliderOptions.ceil;
            } else {
                this.sliderValue.low = moment(this.value.low).diff(this.minDate, 'days');
            }

            // we need min & max dates to determine slider value
            // HIGH
            if (this.value.high.isBefore(this.minDate)) {
                this.sliderValue.high = 0;
            } else if (this.value.high.isAfter(this.maxDate)) {
                this.sliderValue.high = this.sliderOptions.ceil;
            } else {
                this.sliderValue.high = moment(this.value.high).diff(this.minDate, 'days');
            }
        } else {
            // value not set
            this.sliderValue.low = 0;
            this.sliderValue.high = 0;
        }
    }

    /**
     * Trigger change value
     */
    private triggerChangeValue() {
        setTimeout(() => {
            // we need slider element to do this
            if (this.sliderElement) {
                const change = new ChangeContext();
                change.value = this.sliderElement.value;
                change.highValue = this.sliderElement.highValue;
                this.onChange(change, false);
            }
        });
    }
}
