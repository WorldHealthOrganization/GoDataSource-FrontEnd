import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { CaseCenterDateRangeModel } from './case-center-date-range.model';
import * as moment from 'moment';

export class CaseModel {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    phoneNumber: string;
    occupation: string;
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
    safeBurial: boolean;
    dateOfBurial: string;
    dateRanges: CaseCenterDateRangeModel[];
    questionnaireAnswers: {};
    type: EntityType = EntityType.CASE;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    transferRefused: boolean;
    outbreakId: string;
    outcomeId: string;
    deleted: boolean;
    dateBecomeContact: string;
    wasContact: boolean;

    visualId: string;

    relationships: {
        people: any[]
    }[];

    dob: string;
    age: AgeModel;

    inconsistencies: InconsistencyModel[];

    classificationHistory: {
        classification: string,
        startDate: string,
        endDate: string
    }[];

    alerted: boolean = false;
    relationship: any;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.middleName = _.get(data, 'middleName');
        this.lastName = _.get(data, 'lastName');
        this.gender = _.get(data, 'gender');
        this.phoneNumber = _.get(data, 'phoneNumber');
        this.occupation = _.get(data, 'occupation');
        this.documents = _.get(data, 'documents', []);

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
            }
        );

        this.dob = _.get(data, 'dob');
        this.age = new AgeModel(_.get(data, 'age'));

        this.classification = _.get(data, 'classification');
        this.visualId = _.get(data, 'visualId');
        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfInfection = _.get(data, 'dateOfInfection');
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.dateOfOutcome = _.get(data, 'dateOfOutcome');
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
        this.dateOfBurial = _.get(data, 'dateOfBurial');
        this.safeBurial = _.get(data, 'safeBurial');
        this.isDateOfOnsetApproximate = _.get(data, 'isDateOfOnsetApproximate');

        // date ranges locations
        const dateRangeLocations = _.get(data, 'dateRangeLocations');
        this.dateRanges = _.get(data, 'dateRanges', [])
            .map((dateRangeData) => {
                return new CaseCenterDateRangeModel(dateRangeData, dateRangeLocations);
            });

        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.dateOfLastContact = _.get(data, 'dateOfLastContact');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.transferRefused = _.get(data, 'transferRefused');
        this.outbreakId = _.get(data, 'outbreakId');
        this.outcomeId = _.get(data, 'outcomeId');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

        this.relationships = _.get(data, 'relationships', []);
        this.deleted = _.get(data, 'deleted');
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.wasContact = _.get(data, 'wasContact');

        this.inconsistencies = _.get(data, 'inconsistencies', []);
        _.each(this.inconsistencies, (inconsistency, index) => {
            this.inconsistencies[index] = new InconsistencyModel(inconsistency);
        });

        this.classificationHistory = _.get(data, 'classificationHistory', []);
        this.relationship = _.get(data, 'relationship');
    }

    /**
     * Return case id mask with data replaced
     * @param caseIdMask
     */
    static generateCaseIDMask(caseIdMask: string): string {
        // validate
        if (_.isEmpty(caseIdMask)) {
            return '';
        }

        // !!!!!!!!!!!!!!!
        // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
        // !!!!!!!!!!!!!!!
        return caseIdMask
            .replace(/YYYY/g, moment().format('YYYY'))
            .replace(/\*/g, '');
    }

    /**
     * Case Name
     * @returns {string}
     */
    get name(): string {
        const firstName = this.firstName ? this.firstName : '';
        const lastName = this.lastName ? this.lastName : '';
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     * @returns {AddressModel}
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': AddressType.CURRENT_ADDRESS});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
    }
}
