import * as _ from 'lodash';

export class MetricContactsFollowUpModel {
    contactsCount: number;
    followUpsCount: number;
    contactIDs: string[];

    constructor(data = null) {
        this.contactsCount = _.get(data, 'contactsCount');
        this.followUpsCount = _.get(data, 'followUpsCount');
        this.contactIDs = _.get(data, 'contactIDs', []);
    }
}
