import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { FollowUpModel } from './follow-up.model';
import { CaseModel } from './case.model';
import { EntityType } from './entity-type';

/**
 * Model representing a Case, a Contact or an Event
 */
export class RangeFollowUpsModel {
    person: ContactModel | CaseModel;
    followUps: FollowUpModel[];

    constructor(data = null) {
        const contactData = _.get(data, 'contact');
        if (contactData) {
            this.person = contactData.type === EntityType.CASE ?
                new CaseModel(contactData) :
                new ContactModel(contactData);
        }
        this.followUps = _.map(_.get(data, 'followUps'), (followUpData) => {
            return new FollowUpModel(followUpData, false);
        });
    }
}
