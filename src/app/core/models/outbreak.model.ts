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
    caseInvestigationTemplate: any | null;
    contactFollowUpTemplate: any | null;
    labResultsTemplate: any | null;
    nutritionalStatus: any | null;
    pregnancyInformation: any | null;
    vaccinationStatus: any | null;
    caseIdMask: string;
    locationId: string | null;
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
        this.displayDateFormat = null;
        this.highExposureDuration = 0;
        this.caseClassification = {};
        this.caseInvestigationTemplate = _.get(data, 'caseInvestigationTemplate');
        this.contactFollowUpTemplate =  _.get(data, 'contactFollowUpTemplate');
        this.labResultsTemplate =  _.get(data, 'labResultsTemplate');
        this.nutritionalStatus = {};
        this.pregnancyInformation = {};
        this.vaccinationStatus = {};
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.locationId = _.get(data, 'locationId');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    }

}
