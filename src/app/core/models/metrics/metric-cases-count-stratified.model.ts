import * as _ from 'lodash';
import { LocalizationHelper, Moment } from '../../helperClasses/localization-helper';

export class MetricCasesCountStratified {
  start: Moment;
  end: Moment;
  classification: {
    [classificationId: string]: number
  };
  total: number;

  constructor(data = null) {
    this.start = _.get(data, 'start');
    if (this.start) {
      this.start = LocalizationHelper.toMoment(this.start);
    }

    this.end = _.get(data, 'end');
    if (this.end) {
      this.end = LocalizationHelper.toMoment(this.end);
    }

    this.classification = _.get(data, 'classification', {});
    this.total = _.get(data, 'total', 0);
  }
}
