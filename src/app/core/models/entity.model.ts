import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { CaseModel } from './case.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';

/**
 * Model representing a Case, a Contact or an Event
 */
export class EntityModel {
    type: EntityType;
    model: CaseModel | ContactModel | EventModel;

    constructor(data) {
        this.type = _.get(data, 'type');

        switch (this.type) {
            case EntityType.CASE:
                this.model = new CaseModel(data);
                break;

            case EntityType.CONTACT:
                this.model = new ContactModel(data);
                break;

            case EntityType.EVENT:
                this.model = new EventModel(data);
                break;
        }
    }

}
