import * as _ from 'lodash';

export class MetricCasesModel {
  casesCount: number;
  caseIDs: string[];

  constructor(data = null) {
    this.casesCount = _.get(data, 'casesCount', 0);
    this.caseIDs = _.get(data, 'caseIDs', []);
  }
}
