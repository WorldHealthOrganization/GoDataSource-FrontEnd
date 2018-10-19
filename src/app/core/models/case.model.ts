import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { DocumentModel } from './document.model';
import { DateRangeModel } from './date-range.model';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';

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
    deceased: boolean;
    safeBurial: boolean;
    dateDeceased: string;
    hospitalizationDates: DateRangeModel[];
    isolationDates: DateRangeModel[];
    incubationDates: DateRangeModel[];
    questionnaireAnswers: {};
    type: EntityType = EntityType.CASE;
    dateOfReporting: string;
    isDateOfReportingApproximate: boolean;
    transferRefused: boolean;
    outbreakId: string;
    outcomeId: string;
    deleted: boolean;

    visualId: string;

    relationships: {
        people: any[]
    }[];

    dob: string;
    age: AgeModel;

    inconsistencies: InconsistencyModel[];

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
        this.deceased = _.get(data, 'deceased');
        this.dateDeceased = _.get(data, 'dateDeceased');
        this.safeBurial = _.get(data, 'safeBurial');
        this.isDateOfOnsetApproximate = _.get(data, 'isDateOfOnsetApproximate');
        this.hospitalizationDates = _.get(data, 'hospitalizationDates', []);
        this.isolationDates = _.get(data, 'isolationDates', []);
        this.incubationDates = _.get(data, 'incubationDates', []);
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.transferRefused = _.get(data, 'transferRefused');
        this.outbreakId = _.get(data, 'outbreakId');
        this.outcomeId = _.get(data, 'outcomeId');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

        this.relationships = _.get(data, 'relationships', []);
        this.deleted = _.get(data, 'deleted');

        this.inconsistencies = _.get(data, 'inconsistencies', []);
        _.each(this.inconsistencies, (inconsistency, index) => {
            this.inconsistencies[index] = new InconsistencyModel(inconsistency);
        });
    }

    /**
     * Case Name
     * @returns {string}
     */
    get name(): string {
        const firstName = _.get(this, 'firstName', '');
        const lastName = _.get(this, 'lastName', '');
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     * @returns {AddressModel}
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': Constants.ADDRESS_USUAL_PLACE_OF_RESIDENCE});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
    }
}
