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
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from '../../../angular-material/adapter/custom-date-adapter';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { Constants } from '../../../../core/models/constants';
import { MatInput } from '@angular/material/input';
import { MatDatepicker } from '@angular/material/datepicker';

// Define format to be used into datepicker
const DEFAULT_FORMAT = {
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
  selector: 'app-form-date-v2',
  templateUrl: './app-form-date-v2.component.html',
  styleUrls: ['./app-form-date-v2.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppFormDateV2Component),
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
  tooltipTranslated: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // translate tooltip
    this.tooltipTranslated = this._tooltip ?
      this.translateService.instant(this._tooltip) :
      this._tooltip;

    // add / remove tooltip icon
    this.tooltipButton = !this.tooltipTranslated ?
      undefined : {
        icon: 'help',
        tooltip: this.tooltipTranslated
      };
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

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected elementRef: ElementRef
  ) {
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Click button
   */
  iconButtonClick(
    event,
    iconB: IAppFormIconButtonV2
  ): void {
    // prevent propagation
    event.stopPropagation();

    // execute click action
    if (iconB.clickAction) {
      iconB.clickAction(this);
    }
  }

  /**
   * Focus
   */
  focus(): void {
    setTimeout(() => {
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
      this._openAfterInit = false;
      // wait for this.value to be bind
      setTimeout(() => {
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
    setTimeout(() => {
      const input = this.elementRef.nativeElement.querySelector('input');
      if (input) {
        input.value = value;
      }
    });
  }
}
