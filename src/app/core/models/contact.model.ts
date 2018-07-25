import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';

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
        this.documents = _.get(data, 'documents', []);
        this.addresses = _.get(data, 'addresses', []);
        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
    }

    /**
     * Contact Name
     * @returns {string}
     */
    get name(): string {
        return ( this.firstName ? this.firstName : '' ) +
            ' ' + ( this.lastName ? this.lastName : '' );
    }
}
