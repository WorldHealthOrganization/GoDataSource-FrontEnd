import * as _ from 'lodash';
import { LocationModel } from '../location.model';

export class MetricLocationCasesCountsModel {
    location: LocationModel;
    casesCount: number;
    caseIds: string[];

    constructor(data = null) {
        this.location = _.get(data, 'location');
        this.casesCount = _.get(data, 'casesCount', 0);
        this.caseIds = _.get(data, 'caseIds', []);
    }
}
