import * as _ from 'lodash';
import { Moment } from '../helperClasses/localization-helper';

export class LabResultSequenceModel {
  hasSequence: boolean;
  noSequenceReason: string;
  dateSampleSent: string | Moment;
  labId: string;
  dateResult: string | Moment;
  resultId: string;

  /**
     * Constructor
     */
  constructor(data = null) {
    this.hasSequence = _.get(data, 'hasSequence');
    this.noSequenceReason = _.get(data, 'noSequenceReason');
    this.dateSampleSent = _.get(data, 'dateSampleSent');
    this.labId = _.get(data, 'labId');
    this.dateResult = _.get(data, 'dateResult');
    this.resultId = _.get(data, 'resultId');
  }
}
