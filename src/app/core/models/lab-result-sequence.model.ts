import * as _ from 'lodash';

export class LabResultSequenceModel {
  hasSequence: boolean;
  noSequenceReason: string;
  dateSampleSent: string;
  labId: string;
  dateResult: string;
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
