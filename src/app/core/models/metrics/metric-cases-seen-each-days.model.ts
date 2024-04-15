import * as _ from 'lodash';

export class MetricCasesSeenEachDays {
  caseIDs: string[];
  casesSeenCount: number;
  teams: object[];

  constructor(data = null) {
    this.caseIDs = _.get(data, 'contactIDs', []);
    this.casesSeenCount = _.get(data, 'casesSeenCount', 0);
    this.teams = _.get(data, 'teams', []);
  }
}
