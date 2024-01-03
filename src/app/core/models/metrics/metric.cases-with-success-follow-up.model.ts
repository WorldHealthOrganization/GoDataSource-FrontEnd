import * as _ from 'lodash';

export interface CaseFollowedUp {
  id: string;
  totalFollowupsCount: number;
  successfulFollowupsCount: number;
}

export class MetricCasesWithSuccessfulFollowUp {
  cases: CaseFollowedUp[];
  casesWithSuccessfulFollowupsCount: number;
  teams: Object[];
  totalCasesWithFollowupsCount: number;

  constructor(data = null) {
    this.cases = _.get(data, 'cases', []);
    this.casesWithSuccessfulFollowupsCount = _.get(data, 'casesWithSuccessfulFollowupsCount', 0);
    this.teams = _.get(data, 'teams', []);
    this.totalCasesWithFollowupsCount = _.get(data, 'totalCasesWithFollowupsCount', 0);
  }
}
