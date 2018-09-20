import * as _ from 'lodash';

export interface ContactFollowedUp {
    id: string;
    totalFollowupsCount: number;
    successfulFollowupsCount: number;
}

export class MetricContactsWithSuccessfulFollowUp {
    contacts: ContactFollowedUp[];
    contactsWithSuccessfulFollowupsCount: number;
    teams: Object[];
    totalContactsWithFollowupsCount: number;

    constructor(data = null) {
        this.contacts = _.get(data, 'contacts', []);
        this.contactsWithSuccessfulFollowupsCount = _.get(data, 'contactsWithSuccessfulFollowupsCount', 0);
        this.teams = _.get(data, 'teams', []);
        this.totalContactsWithFollowupsCount = _.get(data, 'totalContactsWithFollowupsCount', 0);
    }
}
