import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, EventEmitter,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional, Output,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from '../../../angular-material/adapter/custom-date-adapter';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { MatInput } from '@angular/material/input';
import { MatDatepicker } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

// Define format to be used into datepicker
const DEFAULT_FORMAT = {
  parse: {
    dateInput: LocalizationHelper.getDateDisplayFormat()
  },
  display: {
    dateInput: LocalizationHelper.getDateDisplayFormat(),
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-form-date-v2',
  templateUrl: './app-form-date-v2.component.html',
  styleUrls: ['./app-form-date-v2.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppFormDateV2Component),
      multi: true
    },

    {
      provide: MAT_DATE_FORMATS,
      useValue: DEFAULT_FORMAT
    },

    // tried adding a custom adapter for validations, but the system wasn't picking up the issue and there was no way to set a validation error message
    // this is way we implemented a custom validator directive
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter,
      deps: [
        MAT_DATE_LOCALE,
        MAT_MOMENT_DATE_ADAPTER_OPTIONS,
        I18nService
      ]
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormDateV2Component
  extends AppFormBaseV2<string | Moment> implements OnDestroy {

  // actions
  static readonly ACTION_KEY_CALENDAR: string = 'calendar';

  // right - icon buttons
  @Input() suffixIconButtons: IAppFormIconButtonV2[];

  // float label
  @Input() neverFloatLabel: boolean = false;

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // autocomplete
  @Input() autocomplete: string;

  // tooltip
  tooltipButton: IAppFormIconButtonV2;
  private _tooltip: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // update tooltip translation
    this.updateTooltipTranslation(false);
  }
  get tooltip(): string {
    return this._tooltip;
  }

  // date limits
  @Input() maxDate: Moment | string;
  @Input() minDate: Moment | string;

  // calendar closed
  @Output() calendarClosed = new EventEmitter<void>();

  // input
  private _input: MatInput;
  private _focusAfterInit: boolean = false;
  @ViewChild(MatInput) set input(input: MatInput) {
    // set
    this._input = input;

    // do we need to focus after init ?
    if (this._focusAfterInit) {
      this.focus();
    }
  }
  get input(): MatInput {
    return this._input;
  }

  // calendar
  private _calendar: MatDatepicker<any>;
  private _openAfterInit: boolean = false;
  @ViewChild(MatDatepicker) set calendar(calendar: MatDatepicker<any>) {
    // set
    this._calendar = calendar;

    // do we need to open after init ?
    if (this._openAfterInit) {
      this.open();
    }
  }
  get calendar(): MatDatepicker<any> {
    return this._calendar;
  }

  // timers
  private _focusTimer: number;
  private _openTimer: number;
  private _setStartingValueTimer: number;

  // language handler
  private languageSubscription: Subscription;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected elementRef: ElementRef
  ) {
    // parent
    super(
      controlContainer,
      i18nService,
      changeDetectorRef
    );

    // language change
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // update tooltip translation
        this.updateTooltipTranslation(true);
      });
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // timers
    this.stopFocusTimer();
    this.stopOpenTimer();
    this.stopSetStartingValueTimer();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = undefined;
    }
  }

  /**
   * Update tooltip translation
   */
  private updateTooltipTranslation(detectChanges: boolean): void {
    // translate tooltip
    const tooltipTranslated = this._tooltip ?
      this.i18nService.instant(this._tooltip) :
      this._tooltip;

    // add / remove tooltip icon
    this.tooltipButton = !tooltipTranslated ?
      undefined : {
        icon: 'help',
        tooltip: tooltipTranslated
      };

    // update
    if (detectChanges) {
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Timer - focus
   */
  private stopFocusTimer(): void {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer);
      this._focusTimer = undefined;
    }
  }

  /**
   * Timer - open
   */
  private stopOpenTimer(): void {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = undefined;
    }
  }

  /**
   * Timer - set starting value
   */
  private stopSetStartingValueTimer(): void {
    if (this._setStartingValueTimer) {
      clearTimeout(this._setStartingValueTimer);
      this._setStartingValueTimer = undefined;
    }
  }

  /**
   * Focus
   */
  focus(): void {
    // timer - focus
    this.stopFocusTimer();

    // wait for binds to take effect
    this._focusTimer = setTimeout(() => {
      // reset
      this._focusTimer = undefined;

      // focus
      if (this.input) {
        this._focusAfterInit = false;
        this.input.focus();
      } else {
        this._focusAfterInit = true;
      }
    });
  }

  /**
   * Open
   */
  open(): void {
    if (this.calendar) {
      // reset
      this._openAfterInit = false;

      // timer - open
      this.stopOpenTimer();

      // wait for this.value to be bind
      this._openTimer = setTimeout(() => {
        // reset
        this._openTimer = undefined;

        // open
        this.calendar.open();
      });
    } else {
      this._openAfterInit = true;
    }
  }

  /**
   * Set starting value
   */
  setStartingValue(value: string): void {
    // timer
    this.stopSetStartingValueTimer();

    // wait for binds to take effect
    this._setStartingValueTimer = setTimeout(() => {
      // reset
      this._setStartingValueTimer = undefined;

      // set starting value
      const input = this.elementRef.nativeElement.querySelector('input');
      if (input) {
        input.value = value;
      }
    });
  }
}
