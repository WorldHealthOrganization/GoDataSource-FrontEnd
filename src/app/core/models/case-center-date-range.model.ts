import * as _ from 'lodash';
import { LocationModel } from './location.model';
import { I18nService } from '../services/helper/i18n.service';
import { LocalizationHelper, Moment } from '../helperClasses/localization-helper';

export class CaseCenterDateRangeModel {
  // data
  typeId: string;
  startDate: string | Moment;
  endDate: string | Moment;
  centerName: string;
  locationId: string;
  location: LocationModel;
  comments: string;

  /**
   * Array to string
   */
  static arrayToString(
    i18nService: I18nService,
    dateRanges: CaseCenterDateRangeModel[]
  ): string {
    // nothing to do ?
    if (!dateRanges?.length) {
      return '';
    }

    // create value
    let value: string = '';
    dateRanges.forEach((dateRange) => {
      value += `${value.length < 1 ? '' : ', '}${dateRange.typeId?.length > 0 ? i18nService.instant(dateRange.typeId) : ''} ${dateRange.startDate ? LocalizationHelper.displayDate(dateRange.startDate) : '' } - ${dateRange.endDate ? LocalizationHelper.displayDate(dateRange.endDate) : '' }: ${dateRange.centerName?.length > 0 ? i18nService.instant(dateRange.centerName) : ''}`;
    });

    // finished
    return value;
  }

  /**
   * Constructor
   */
  constructor(data = null, locationsList: LocationModel[] = []) {
    this.typeId = _.get(data, 'typeId');
    this.startDate = _.get(data, 'startDate');
    this.endDate = _.get(data, 'endDate');
    this.centerName = _.get(data, 'centerName');
    this.locationId = _.get(data, 'locationId');
    // find the location
    const location = _.find(locationsList, { id: this.locationId });
    this.location = new LocationModel(location);
    this.comments = _.get(data, 'comments');
  }

  /**
   * Clone class
   */
  sanitize(): Object {
    // create clone
    const instance = _.cloneDeep(this);

    // remove properties that we don't want to save
    delete instance.location;

    // finished
    return instance;
  }
}
