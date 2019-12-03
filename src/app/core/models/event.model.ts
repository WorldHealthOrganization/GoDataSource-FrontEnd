import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { BaseModel } from './base.model';

export class EventModel extends BaseModel {
    id: string;
    name: string;
    date: string;
    dateApproximate: boolean;
    description: string;
    address: AddressModel;
    type: EntityType = EntityType.EVENT;
    dateOfReporting: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;

    numberOfContacts: number;
    numberOfExposures: number;

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.date = _.get(data, 'date');
        this.dateApproximate = _.get(data, 'dateApproximate');
        this.description = _.get(data, 'description');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.outbreakId = _.get(data, 'outbreakId');

        this.numberOfContacts = _.get(data, 'numberOfContacts');
        this.numberOfExposures = _.get(data, 'numberOfExposures');

        // we need the object to use the custom getter that constructs the address from all fields
        const location = _.get(data, 'location');
        this.address = new AddressModel(_.get(data, 'address'), [location]);

        this.inconsistencies = _.get(data, 'inconsistencies', []);
        _.each(this.inconsistencies, (inconsistency, index) => {
            this.inconsistencies[index] = new InconsistencyModel(inconsistency);
        });

        this.relationship = _.get(data, 'relationship');

        this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
        _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
            this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
        });
    }

    get firstName(): string {
        return this.name;
    }

    get lastName(): string {
        return '';
    }

    /**
     * Get the main Address
     */
    get mainAddress(): AddressModel {
        return this.address;
    }
}
