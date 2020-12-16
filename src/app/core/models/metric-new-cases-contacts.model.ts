import * as _ from 'lodash';

export class MetricNewCasesWithContactsModel {
    newCasesCount: number;
    newCasesAmongKnownContactsCount: number;
    newCasesAmongKnownContactsIDs: string[];

    constructor(data = null) {
        this.newCasesCount = _.get(data, 'newCasesCount', 0);
        this.newCasesAmongKnownContactsCount = _.get(data, 'newCasesAmongKnownContactsCount', 0);
        this.newCasesAmongKnownContactsIDs = _.get(data, 'newCasesAmongKnownContactsIDs', []);
    }
}
