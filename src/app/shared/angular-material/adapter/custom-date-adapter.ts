import { MatMomentDateAdapterOptions, MomentDateAdapter } from '@angular/material-moment-adapter';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { LocalizationHelper, Moment } from '../../../core/helperClasses/localization-helper';

export class CustomDateAdapter extends MomentDateAdapter {

  /**
   * Constructor
   */
  constructor(
    dateLocale: string,
    _options?: MatMomentDateAdapterOptions | undefined,
    private i18nService?: I18nService
  ) {
    super(
      dateLocale,
      _options
    );
  }

  /**
   * Start the calendar with this day of the week
   * 0 = Sunday
   * 1 = Monday
   *
   * return number
   */
  getFirstDayOfWeek(): number {
    return 1;
  }

  /**
   * Retrieve week names
   */
  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    // translate token accordingly to language
    switch (style) {
      case 'narrow':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_SUNDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_MONDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_TUESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_WEDNESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_THURSDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_FRIDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_SATURDAY')
        ];
      case 'long':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_SUNDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_MONDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_TUESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_WEDNESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_THURSDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_FRIDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_SATURDAY')
        ];
      case 'short':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_SUNDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_MONDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_TUESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_WEDNESDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_THURSDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_FRIDAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_SATURDAY')
        ];

        // no translation if not handled
        // better display wrong language then nothing
      default:
        return super.getDayOfWeekNames(style);
    }
  }

  /**
   * Get month name
   */
  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    // translate token accordingly to language
    switch (style) {
      case 'narrow':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JANUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_FEBRUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_MARCH'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_APRIL'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_MAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JUNE'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JULY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_AUGUST'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_SEPTEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_OCTOBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_NOVEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_DECEMBER')
        ];
      case 'long':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JANUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_FEBRUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_MARCH'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_APRIL'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_MAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JUNE'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JULY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_AUGUST'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_SEPTEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_OCTOBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_NOVEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_DECEMBER')
        ];
      case 'short':
        return [
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JANUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_FEBRUARY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_MARCH'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_APRIL'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_MAY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JUNE'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JULY'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_AUGUST'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_SEPTEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_OCTOBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_NOVEMBER'),
          this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_DECEMBER')
        ];

        // no translation if not handled
        // better display wrong language then nothing
      default:
        return super.getMonthNames(style);
    }
  }

  /**
   * Date names => 1 - 31
   */
  getDateNames(): string[] {
    return [
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_1'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_2'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_3'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_4'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_5'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_6'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_7'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_8'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_9'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_10'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_11'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_12'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_13'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_14'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_15'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_16'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_17'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_18'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_19'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_20'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_21'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_22'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_23'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_24'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_25'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_26'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_27'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_28'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_29'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_30'),
      this.i18nService.instant('LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_31')
    ];
  }

  /**
     * Year name
     */
  getYearName(date: Moment): string {
    // for now, we won't translate this since it depends on date and might complicate things (too many language tokens)
    return super.getYearName(date);
  }

  /**
   * Configure moment for custom translations
   */
  private configureMoment(): void {
    LocalizationHelper.updateLocale(
      'custom', {
        months: this.getMonthNames('long'),
        monthsShort: this.getMonthNames('short')
      }
    );
  }

  /**
   * Format date
   */
  format(date: Moment, displayFormat: string): string {
    // retrieve current locale
    const currentLocale: string = LocalizationHelper.locale();

    // configure custom locale with custom month names
    this.configureMoment();
    LocalizationHelper.locale('custom');

    // format date
    const formattedDate: string = date ?
      LocalizationHelper.toMoment(date).format(displayFormat) :
      '';

    // reset back to previous locale
    LocalizationHelper.locale(currentLocale);

    // finished
    return formattedDate;
  }

}
