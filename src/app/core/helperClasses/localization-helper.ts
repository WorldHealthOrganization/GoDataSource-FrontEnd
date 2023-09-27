import * as moment from 'moment-timezone';
import { Moment as MomentOriginal, unitOfTime as MomentUnitOfTime } from 'moment-timezone';
import { Constants } from '../models/constants';
import { Duration, DurationInputArg1, MomentBuiltinFormat as MomentBuiltinFormatOriginal } from 'moment/moment';

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

  // moment
  // #TODO - remove and add functions, otherwise we might do mistakes and use this one instead of toMoment
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
}
