import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { FollowUpModel } from './follow-up.model';

/**
 * Model representing a Case, a Contact or an Event
 */
export class RangeFollowUpsModel {
    contact: ContactModel;
    followUps: FollowUpModel[];

    constructor(data = null) {
        this.contact = new ContactModel(_.get(data, 'contact'));
        this.followUps = _.map(_.get(data, 'followUps'), (followUpData) => {
            return new FollowUpModel(followUpData, false);
        });
    }
}
