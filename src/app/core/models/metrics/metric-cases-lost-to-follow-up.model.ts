import * as _ from 'lodash';

export class MetricCasesLostToFollowUpModel {
  casesCount: number;
  caseIDs: string[];

  constructor(data = null) {
    this.casesCount = _.get(data, 'casesLostToFollowupCount');
    this.caseIDs = _.get(data, 'caseIDs', []);
  }
}
