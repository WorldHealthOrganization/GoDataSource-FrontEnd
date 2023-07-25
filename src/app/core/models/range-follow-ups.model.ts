import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { FollowUpModel } from './follow-up.model';
import { CaseModel } from './case.model';
import { EntityType } from './entity-type';
import { ContactOfContactModel } from './contact-of-contact.model';

/**
 * Model representing a Case, a Contact or an Event
 */
export class RangeFollowUpsModel {
  person: ContactOfContactModel | ContactModel | CaseModel;
  followUps: FollowUpModel[];

  constructor(data = null) {
    const contactData = _.get(data, 'contact');
    if (contactData) {
      // get entity
      switch (contactData.type) {
        case EntityType.CASE:
          this.person = new CaseModel(contactData);
          break;
        case EntityType.CONTACT_OF_CONTACT:
          this.person = new ContactOfContactModel(contactData);
          break;
        // case EntityType.CONTACT:
        default:
          this.person = new ContactModel(contactData);
          break;
      }
    }
    this.followUps = _.map(_.get(data, 'followUps'), (followUpData) => {
      return new FollowUpModel(followUpData, false);
    });
  }
}
