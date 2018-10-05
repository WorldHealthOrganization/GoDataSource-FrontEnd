import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { Constants } from './constants';

export class ContactModel {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    phoneNumber: string;
    occupation: string;
    dob: string;
    age: number;
    documents: DocumentModel[];
    addresses: AddressModel[];
    riskLevel: string;
    riskReason: string;
    type: EntityType = EntityType.CONTACT;
    dateOfReporting: string;
    isDateOfReportingApproximate: boolean;
    dateDeceased: string;
    outbreakId: string;
    deleted: boolean;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.middleName = _.get(data, 'middleName');
        this.lastName = _.get(data, 'lastName');
        this.gender = _.get(data, 'gender');
        this.phoneNumber = _.get(data, 'phoneNumber');
        this.occupation = _.get(data, 'occupation');
        this.dob = _.get(data, 'dob');
        this.age = _.get(data, 'age');
        this.outbreakId = _.get(data, 'outbreakId');
        this.documents = _.get(data, 'documents', []);

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
            }
        );

        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.dateDeceased = _.get(data, 'dateDeceased');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.deleted = _.get(data, 'deleted');
    }

    /**
     * Contact Name
     * @returns {string}
     */
    get name(): string {
        const firstName = _.get(this, 'firstName', '');
        const lastName = _.get(this, 'lastName', '');
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': Constants.ADDRESS_USUAL_PLACE_OF_RESIDENCE});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
    }
}
