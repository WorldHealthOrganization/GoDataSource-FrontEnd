import * as _ from 'lodash';

export class MetricContactsSeenEachDays {
    contactIDs: string[];
    contactsSeenCount: number;
    teams: object[];

    constructor(data = null) {
        this.contactIDs = _.get(data, 'contactIDs', []);
        this.contactsSeenCount = _.get(data, 'contactsSeenCount', 0);
        this.teams = _.get(data, 'teams', []);
    }
}
