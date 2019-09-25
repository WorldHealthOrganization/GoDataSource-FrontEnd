import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { VaccineModel } from './vaccine.model';

export interface IFollowUpHistory {
    startDate: string;
    endDate: string;
    status: string;
}

export class ContactModel extends BaseModel {
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
    type: EntityType = EntityType.CONTACT;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;
    dateBecomeContact: string;
    dateBecomeCase: string;
    wasCase: boolean;
    visualId: string;

    followUp: {
        originalStartDate: string,
        startDate: string,
        endDate: string,
        status: string
    };

    followUpHistory: IFollowUpHistory[];

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

        this.followUp = _.get(data, 'followUp', {});
        this.followUpHistory = _.get(data, 'followUpHistory', []);

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

    /**
     * Return contact id mask with data replaced
     * @param contactIdMask
     */
    static generateContactIDMask(contactIdMask: string): string {
        // validate
        if (_.isEmpty(contactIdMask)) {
            return '';
        }

        // !!!!!!!!!!!!!!!
        // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
        // !!!!!!!!!!!!!!!
        return contactIdMask
            .replace(/YYYY/g, moment().format('YYYY'))
            .replace(/\*/g, '');
    }

    /**
     * Contact Name
     * @returns {string}
     */
    get name(): string {
        const firstName = this.firstName ? this.firstName : '';
        const lastName = this.lastName ? this.lastName : '';
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': AddressType.CURRENT_ADDRESS});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
    }

    /**
     * Get phone numbers
     */
    get phoneNumbers(): string[] {
        return this.addresses.reduce((acc: string[], address) => {
            if (!_.isEmpty(address.phoneNumber)) {
                acc.push(address.phoneNumber);
            }
            return acc;
        }, []);
    }
}
