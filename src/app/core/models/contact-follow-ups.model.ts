import * as _ from 'lodash';
import { FollowUpModel } from './follow-up.model';

export class ContactFollowUpsModel {
    contactId: string;
    followUps: FollowUpModel[];

    constructor(data = null) {
        this.contactId = _.get(data, 'contactId');
        this.followUps = _.get(data, 'followUps', []);
    }
}
