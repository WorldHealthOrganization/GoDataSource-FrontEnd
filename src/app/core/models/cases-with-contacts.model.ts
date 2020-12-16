import * as _ from 'lodash';

export class CasesWithContactsModel {
    id: number;
    contactsCount: number;
    contactIDs: string[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.contactsCount = _.get(data, 'contactsCount', 0);
        this.contactIDs = _.get(data, 'contactIDs', []);
    }
}
