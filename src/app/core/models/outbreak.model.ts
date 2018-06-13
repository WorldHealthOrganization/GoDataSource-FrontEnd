import * as _ from 'lodash';

export class OutbreakModel {
    id: string;
    name: string;
    description: string;
    disease: string;
    active: boolean;
    startDate: string;
    endDate: string | null;
    country: string;
    periodOfFollowup: number;
    frequencyOfFollowUp: number;
    displayDateFormat: string;
    noDaysAmongContacts: number;
    noDaysDaysInChains: number;
    noDaysNotSeen: number;
    noLessContacts: number;
    highExposureDuration: number | 0;
    caseClassification: any | null;
    caseInvestigationTemplate: any;
    contactFollowUpTemplate: any | null;
    labResultsTemplate: any | null;
    nutritionalStatus: any | null;
    pregnancyInformation: any | null;
    vaccinationStatus: any | null;
    caseIdMask: string;
    locationId: any | null;
    longPeriodsBetweenCaseOnset: number;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
        this.active = _.get(data, 'active');
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.country = _.get(data, 'country');
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUp = _.get(data, 'frequencyOfFollowUp');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysDaysInChains = _.get(data, 'noDaysDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        // initialize with 0 until they will be removed from the API or made not mandatory
        this.displayDateFormat = null;
        this.highExposureDuration = 0;
        // initialize with array  - temporary
        // TODO read from reference data
        this.caseClassification = [{"test": "test"}];
        this.caseInvestigationTemplate = _.get(data, 'caseInvestigationTemplate');
        if(this.caseInvestigationTemplate == null)
            this.caseInvestigationTemplate = [];
        this.contactFollowUpTemplate = _.get(data, 'contactFollowUpTemplate');
        if(this.contactFollowUpTemplate == null)
            this.contactFollowUpTemplate = [];
        this.labResultsTemplate = _.get(data, 'labResultsTemplate');
        if(this.labResultsTemplate == null)
            this.labResultsTemplate = [];
        // initialize with array until they will be removed from the API or made not mandatory
        this.nutritionalStatus = [{"test": "test"}];
        this.pregnancyInformation = [{"test": "test"}];
        this.vaccinationStatus = [{"test": "test"}];
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.locationId = _.get(data, 'locationId');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    }

}
