import * as _ from 'lodash';
import { RelationshipPersonModel } from './relationship-person.model';

/**
 * Model representing a Case, a Contact or an Event
 */
export class EntityMatchedRelationshipModel {
    relationshipId: string;
    relatedPerson: RelationshipPersonModel;

    constructor(data) {
        this.relationshipId = _.get(data, 'type');
        this.relatedPerson = new RelationshipPersonModel(_.get(data, 'relatedPerson'));
    }
}
