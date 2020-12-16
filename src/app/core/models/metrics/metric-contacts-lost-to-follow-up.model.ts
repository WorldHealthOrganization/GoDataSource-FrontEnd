import * as _ from 'lodash';

export class MetricContactsLostToFollowUpModel {
    contactsCount: number;
    contactIDs: string[];

    constructor(data = null) {
        this.contactsCount = _.get(data, 'contactsLostToFollowupCount');
        this.contactIDs = _.get(data, 'contactIDs', []);
    }
}
