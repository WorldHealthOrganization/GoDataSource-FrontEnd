import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

export class ChronologyItem {
  // date
  private _date: Moment;
  public set date(date: string | Moment) {
    // make sure that date is a date :)
    this._date = date ? LocalizationHelper.toMoment(date) : null;
  }
  get date(): Moment {
    return this._date;
  }

  // data
  public label: string;
  public daysSincePreviousEvent: number;
  public type: string;
  public translateData: {
    [key: string]: string
  } = {};

  /**
   * Constructor
   */
  constructor(data: {
    // required
    label: string,
    date: string | Moment,

    // optional
    type?: string,
    translateData?: {
      [key: string]: string
    }
  }) {
    // assign properties
    Object.assign(
      this,
      data
    );
  }
}
