import { DocumentModel } from './document.model';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';
import { AgeModel } from './age.model';
import { VaccineModel } from './vaccine.model';
import { InconsistencyModel } from './inconsistency.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import * as _ from 'lodash';
import { BaseModel } from './base.model';

export class ContactOfContactModel extends BaseModel {

    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    occupation: string;
    documents: DocumentModel[];
    addresses: AddressModel[];
    riskLevel: string;
    riskReason: string;
    type: EntityType = EntityType.CONTACT_OF_CONTACT;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;
    dateBecomeContact: string;
    dateBecomeCase: string;
    wasCase: boolean;
    visualId: string;

    numberOfContacts: number;
    numberOfExposures: number;

    // followUp: {
    //     originalStartDate: string,
    //     startDate: string,
    //     endDate: string,
    //     status: string
    // };
    //
    // followUpHistory: IFollowUpHistory[];

    dob: string;
    age: AgeModel;

    vaccinesReceived: VaccineModel[];
    pregnancyStatus: string;

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.middleName = _.get(data, 'middleName');
        this.lastName = _.get(data, 'lastName');
        this.gender = _.get(data, 'gender');
        this.occupation = _.get(data, 'occupation');
        this.outbreakId = _.get(data, 'outbreakId');
        this.documents = _.get(data, 'documents', []);
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
        this.wasCase = _.get(data, 'wasCase', false);

        this.dob = _.get(data, 'dob');
        this.age = new AgeModel(_.get(data, 'age'));

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
            }
        );

        this.numberOfContacts = _.get(data, 'numberOfContacts');
        this.numberOfExposures = _.get(data, 'numberOfExposures');

        // vaccines received
        const vaccinesReceived = _.get(data, 'vaccinesReceived');
        this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
            return new VaccineModel(vaccineData);
        });
        this.pregnancyStatus = _.get(data, 'pregnancyStatus');

        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.dateOfLastContact = _.get(data, 'dateOfLastContact');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.visualId = _.get(data, 'visualId', '');

        // this.followUp = _.get(data, 'followUp', {});
        // this.followUpHistory = _.get(data, 'followUpHistory', []);

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
}
