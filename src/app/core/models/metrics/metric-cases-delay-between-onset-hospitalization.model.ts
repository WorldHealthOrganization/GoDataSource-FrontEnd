import * as _ from 'lodash';
import { CaseModel } from '../case.model';

export class MetricCasesDelayBetweenOnsetHospitalizationModel {
    dateOfOnset: string;
    hospitalizationIsolationDate: string;
    delay: number;
    case: CaseModel;

    constructor(data = null) {
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.hospitalizationIsolationDate = _.get(data, 'hospitalizationIsolationDate');
        this.delay = _.get(data, 'delay');

        this.case = _.get(data, 'case');
        this.case = this.case ? new CaseModel(this.case) : this.case;
    }
}
