import * as _ from 'lodash';
import { CaseModel } from '../case.model';

export class MetricCasesDelayBetweenOnsetLabTestModel {
    dateOfOnset: string;
    dateSampleTaken: string;
    delay: number;
    case: CaseModel;

    constructor(data = null) {
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.dateSampleTaken = _.get(data, 'dateSampleTaken');
        this.delay = _.get(data, 'delay');

        this.case = _.get(data, 'case');
        this.case = this.case ? new CaseModel(this.case) : this.case;
    }
}
