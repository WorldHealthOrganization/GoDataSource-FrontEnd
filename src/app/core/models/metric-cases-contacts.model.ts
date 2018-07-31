import * as _ from 'lodash';
import { CasesWithContactsModel } from './cases-with-contacts.model';

export class MetricCasesWithContactsModel {
    casesCount: number;
    caseIDs: string[];
    cases: CasesWithContactsModel[];

    constructor(data = null) {
        this.casesCount = _.get(data, 'casesCount', 0);
        this.caseIDs = _.get(data, 'caseIDs', []);
        this.cases = _.get(data, 'cases', []);
    }
}
