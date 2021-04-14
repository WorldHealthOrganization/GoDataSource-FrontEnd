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
    EventEmitter, OnDestroy
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { Constants } from '../../../../core/models/constants';
import { ElementBase } from '../../core/index';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { MatDatepicker } from '@angular/material/datepicker';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { Subscription } from 'rxjs/internal/Subscription';
import { StorageKey, StorageService } from '../../../../core/services/helper/storage.service';
import { LanguageAbvHelper } from '../../../../core/helperClasses/language-abv.helper';

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
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: FormDatepickerComponent,
            multi: true
        },

        // always UTC
        {
            provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS,
            useValue: {
                useUtc: true
            }
        },

        {
            provide: MAT_DATE_FORMATS,
            useValue: DEFAULT_FORMAT
        },

        // tried adding a custom adapter for validations, but the system wasn't picking up the issue and there was no way to set a validation error message
        // this is way we implemented a custom validator directive
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [
                MAT_DATE_LOCALE,
                MAT_MOMENT_DATE_ADAPTER_OPTIONS
            ]
        }
    ]
})
export class FormDatepickerComponent extends ElementBase<string> implements OnDestroy {
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
    }
    get tooltip(): string {
        return this._tooltip;
    }

    public identifier = `form-datepicker-${FormDatepickerComponent.identifier++}`;

    @Output() optionChanged = new EventEmitter<any>();

    // language subscription
    private languageSubscription: Subscription;

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private i18nService: I18nService,
        private dateAdapter: DateAdapter<any>,
        private storageService: StorageService
    ) {
        super(controlContainer, validators, asyncValidators);

        // set the selected language locale
        this.dateAdapter.setLocale(LanguageAbvHelper.getLocale(this.i18nService.getSelectedLanguageId()));

        // on language change..we need to translate again the token and change the locale
        this.languageSubscription = this.i18nService.languageChangedEvent.subscribe(() => {
            this.tooltip = this._tooltipToken;
            this.dateAdapter.setLocale(LanguageAbvHelper.getLocale(this.storageService.get(StorageKey.SELECTED_LANGUAGE_ID)));
        });
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        if (this.languageSubscription) {
            this.languageSubscription.unsubscribe();
            this.languageSubscription = null;
        }
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

    /**
     * Show date picker dialog if necessary
     */
    showDatePickerDialog(pickerStartDate: MatDatepicker<any>) {
        if (!pickerStartDate.opened) {
            pickerStartDate.open();
        }
    }
}
