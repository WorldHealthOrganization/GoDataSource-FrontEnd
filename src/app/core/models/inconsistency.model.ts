import * as _ from 'lodash';
import { InconsistencyIssueEnum } from '../enums/inconsistency-issue.enum';

export class InconsistencyModel {
    dates: {
        field: string,
        label: string
    }[];
    issue: InconsistencyIssueEnum;

    constructor(data = null) {
        this.dates = _.get(data, 'dates', []);
        this.issue = _.get(data, 'issue');
    }
}
