import * as _ from 'lodash';

export class MetricCasesTransmissionChainsModel {
    newCases: number;
    total: number;
    caseIDs: string[];

    constructor(data = null) {
        this.newCases = _.get(data, 'newCases', 0);
        this.total = _.get(data, 'total', 0);
        this.caseIDs = _.get(data, 'caseIDs', []);
    }
}
