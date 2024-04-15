import * as moment from 'moment-timezone';
import { Moment as MomentOriginal, unitOfTime as MomentUnitOfTime, Duration, DurationInputArg1, Locale, LocaleSpecification, MomentBuiltinFormat as MomentBuiltinFormatOriginal } from 'moment-timezone';

/**
 * Types
 */
export type Moment = MomentOriginal;
export type MomentBuiltinFormat = MomentBuiltinFormatOriginal;

/**
 * Localization helper
 */
export abstract class LocalizationHelper {
  // server default timezone
  private static TIMEZONE: string = 'UTC';

  // other constants
  static readonly ISO_8601: MomentBuiltinFormat = moment.ISO_8601;

  // default display constants
  private static readonly DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';
  private static readonly DEFAULT_DATE_TIME_DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

  /**
   * Initialize
   */
  static initialize(timezone: string): void {
    // #TODO - enable deprecation warning by removing this code once this is addressed in the entire website
    (moment as any).suppressDeprecationWarnings = true;

    // default timezone
    LocalizationHelper.TIMEZONE = timezone;
    moment.tz.setDefault(LocalizationHelper.TIMEZONE);
  }

  /**
   * Date display format
   */
  static getDateDisplayFormat(): string {
    return LocalizationHelper.DEFAULT_DATE_DISPLAY_FORMAT;
  }

  /**
   * Now
   */
  static now(): Moment {
    return moment();
  }

  /**
   * Today
   */
  static today(): Moment {
    return moment().startOf('day');
  }

  /**
   * Convert / Clone moment
   */
  static toMoment(
    data: string | Date | Moment,
    format?: moment.MomentFormatSpecification,
    strict?: boolean
  ): Moment {
    return moment(
      data,
      format,
      strict
    ).tz(LocalizationHelper.TIMEZONE);
  }

  /**
   * Prepare date for display - date
   */
  static displayDate(data: string | Date | Moment): string {
    return data ?
      LocalizationHelper.toMoment(data).format(LocalizationHelper.DEFAULT_DATE_DISPLAY_FORMAT) :
      '';
  }

  /**
   * Prepare date for display - date & time
   */
  static displayDateTime(data: string | Date | Moment): string {
    return data ?
      LocalizationHelper.toMoment(data).format(LocalizationHelper.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
      '';
  }

  /**
   * Extract the duration between two dates in friendly form
   */
  static humanizeDurationBetweenTwoDates(
    endDate: Moment,
    startDate: Moment
  ): string {
    // return if no dates are provided
    if (
      !startDate ||
      !endDate
    ) {
      return undefined;
    }

    // define the units of time
    const unitsOfTime: MomentUnitOfTime.Base[] = [
      'y',
      'M',
      'd',
      'h',
      'm',
      's'
    ];

    // calculate duration
    const diffDuration = moment.duration(endDate.diff(startDate));

    // extract and format the duration
    let formattedDuration: string = '';
    unitsOfTime.forEach((item: MomentUnitOfTime.Base) => {
      // extract the value
      const value: number = diffDuration.get(item);
      if (value < 1) {
        return;
      }

      // add the value
      formattedDuration = `${formattedDuration ? formattedDuration + ' ' : ''}${value}${item}`;
    });

    // return the formatted duration
    return formattedDuration;
  }

  /**
   * Determine duration
   */
  static duration(inp: DurationInputArg1): Duration {
    return moment.duration(inp);
  }

  /**
   * Update locale
   */
  static updateLocale(
    language: string,
    localeSpec: LocaleSpecification | null
  ): Locale {
    return moment.updateLocale(
      language,
      localeSpec
    );
  }

  /**
   * Locale
   */
  static locale(language?: string): string {
    return moment.locale(language);
  }

  /**
   * Is instance of moment ?
   */
  static isInstanceOfMoment(value: any): boolean {
    return value instanceof moment;
  }
}
