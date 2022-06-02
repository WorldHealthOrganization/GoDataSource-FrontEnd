import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional,
  SkipSelf, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from '../../../angular-material/adapter/custom-date-adapter';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DEFAULT_FORMAT } from '../../../xt-forms/components/form-datepicker/form-datepicker.component';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

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

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
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
}
