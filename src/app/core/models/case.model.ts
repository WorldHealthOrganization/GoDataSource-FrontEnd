import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { DocumentModel } from './document.model';

export class CaseModel {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    phoneNumber: string;
    occupation: string;
    dob: string;
    age: number;
    riskLevel: string;
    riskReason: string;
    documents: DocumentModel[];
    addresses: AddressModel[];
    classification: string;
    dateOfInfection: string;
    dateOfOnset: string;
    isDateOfOnsetApproximate: boolean;
    dateOfOutcome: string;
    dateBecomeCase: string;
    deceased: boolean;
    dateDeceased: string;
    hospitalizationDates: string[];
    isolationDates: string[];

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
        this.classification = _.get(data, 'classification');
        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfInfection = _.get(data, 'dateOfInfection');
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.dateOfOutcome = _.get(data, 'dateOfOutcome');
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
        this.deceased = _.get(data, 'deceased');
        this.dateDeceased = _.get(data, 'dateDeceased');
        this.isDateOfOnsetApproximate = _.get(data, 'isDateOfOnsetApproximate');
        this.hospitalizationDates = _.get(data, 'hospitalizationDates', []);
        this.isolationDates = _.get(data, 'isolationDates', []);
    }
}
