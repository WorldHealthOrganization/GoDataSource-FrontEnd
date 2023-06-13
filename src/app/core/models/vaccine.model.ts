import * as _ from 'lodash';
import { Moment } from 'moment';
import { I18nService } from '../services/helper/i18n.service';
import { moment } from '../helperClasses/x-moment';
import { Constants } from './constants';

export class VaccineModel {
  // data
  vaccine: string;
  date: string | Moment;
  status: string;

  /**
   * Array to string
   */
  static arrayToString(
    i18nService: I18nService,
    vaccines: VaccineModel[]
  ): string {
    // nothing to do ?
    if (!vaccines?.length) {
      return '';
    }

    // create value
    let value: string = '';
    vaccines.forEach((vac) => {
      value += `${value.length < 1 ? '' : ', '}${vac.vaccine?.length > 0 ? i18nService.instant(vac.vaccine) : vac.vaccine} - ${vac.date ? moment(vac.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '' }: ${vac.status?.length > 0 ? i18nService.instant(vac.status) : vac.status}`;
    });

    // finished
    return value;
  }

  /**
   * Constructor
   */
  constructor(data = null) {
    this.vaccine = _.get(data, 'vaccine');
    this.date = _.get(data, 'date');
    this.status = _.get(data, 'status');
  }
}
