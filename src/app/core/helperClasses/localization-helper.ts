import * as moment from 'moment-timezone';
import { Moment as MomentOriginal } from 'moment-timezone';
import { Constants } from '../models/constants';
import { Locale, LocaleSpecification } from 'moment/moment';

/**
 * Types
 */
export type Moment = MomentOriginal;

/**
 * Localization helper
 */
export abstract class LocalizationHelper {
  // server default timezone
  private static TIMEZONE: string = 'UTC';

  // moment
  static readonly moment = moment;

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
   * @param data
   */
  static toMoment(data: string | Date | Moment): Moment {
    return moment(data).tz(LocalizationHelper.TIMEZONE);
  }

  /**
   * Prepare date for display - date
   */
  static displayDate(data: string | Date | Moment): string {
    return data ?
      LocalizationHelper.toMoment(data).tz(LocalizationHelper.TIMEZONE).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
      '';
  }

  /**
   * Prepare date for display - date & time
   */
  static displayDateTime(data: string | Date | Moment): string {
    return data ?
      LocalizationHelper.toMoment(data).tz(LocalizationHelper.TIMEZONE).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
      '';
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
}
