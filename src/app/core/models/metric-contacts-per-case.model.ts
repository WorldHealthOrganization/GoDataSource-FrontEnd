import * as _ from 'lodash';
import { CasesWithContactsModel } from './cases-with-contacts.model';

export class MetricContactsPerCaseModel {
    casesCount: number;
    contactsCount: number;
    meanNoContactsPerCase: number;
    medianNoContactsPerCase: number;
    cases: CasesWithContactsModel[];

    constructor(data = null) {
        this.casesCount = _.get(data, 'casesCount', 0);
        this.contactsCount = _.get(data, 'contactsCount', 0);
        this.meanNoContactsPerCase = _.get(data, 'meanNoContactsPerCase', 0);
        if (this.meanNoContactsPerCase === null) {
            this.meanNoContactsPerCase = 0;
        }
        this.medianNoContactsPerCase = _.get(data, 'medianNoContactsPerCase', 0);
        if (this.medianNoContactsPerCase === null) {
            this.medianNoContactsPerCase = 0;
        }
        this.cases = _.get(data, 'cases', []);
    }
}
