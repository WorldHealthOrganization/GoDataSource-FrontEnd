import * as _ from 'lodash';
import { LocalizationHelper, Moment } from '../../helperClasses/localization-helper';

export class MetricCasesCountStratifiedOutcome {
  start: Moment;
  end: Moment;
  outcome: {
    [outcomeId: string]: number
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

    this.outcome = _.get(data, 'outcome', {});
    this.total = _.get(data, 'total', 0);
  }
}
