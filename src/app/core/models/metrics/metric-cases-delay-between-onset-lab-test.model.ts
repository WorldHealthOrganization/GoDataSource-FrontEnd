import * as _ from 'lodash';
import { CaseModel } from '../case.model';

export class MetricCasesDelayBetweenOnsetLabTestModel {
    dateOfOnset: string;
    dateOfFirstLabTest: string;
    delay: number;
    case: CaseModel;

    constructor(data = null) {
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.dateOfFirstLabTest = _.get(data, 'dateOfFirstLabTest');
        this.delay = _.get(data, 'delay');
        this.case = _.get(data, 'case');
    }
}
