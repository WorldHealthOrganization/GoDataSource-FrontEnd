import * as _ from 'lodash';

export class MetricContactsModel {
    contactsCount: number;
    contactIDs: string[];

    constructor(data = null) {
        this.contactsCount = _.get(data, 'contactsCount', 0);
        this.contactIDs = _.get(data, 'contactIDs', []);
    }
}
