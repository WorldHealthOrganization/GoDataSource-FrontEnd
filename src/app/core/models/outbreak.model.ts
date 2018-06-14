import * as _ from 'lodash';

export class OutbreakModel {
    id: string;
    name: string;
    description: string;
    disease: string;
    active: boolean;
    startDate: string;
    endDate: string | null;
    periodOfFollowup: number;
    frequencyOfFollowUp: number;
    noDaysAmongContacts: number;
    noDaysDaysInChains: number;
    noDaysNotSeen: number;
    noLessContacts: number;
    caseInvestigationTemplate: any;
    contactFollowUpTemplate: any | null;
    labResultsTemplate: any | null;
    // TODO - need to allow to set case classifications on outbreak
    // caseClassification: any | null;
    caseIdMask: string;
    countries: any | null;
    longPeriodsBetweenCaseOnset: number;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
        this.active = _.get(data, 'active');
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.countries = _.get(data, 'countries');
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUp = _.get(data, 'frequencyOfFollowUp');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysDaysInChains = _.get(data, 'noDaysDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        // TODO read from reference data
        // this.caseClassification = [{"test": "test"}];
        this.caseInvestigationTemplate = _.get(data, 'caseInvestigationTemplate');
        if(this.caseInvestigationTemplate == null)
            this.caseInvestigationTemplate = [];
        this.contactFollowUpTemplate = _.get(data, 'contactFollowUpTemplate');
        if(this.contactFollowUpTemplate == null)
            this.contactFollowUpTemplate = [];
        this.labResultsTemplate = _.get(data, 'labResultsTemplate');
        if(this.labResultsTemplate == null)
            this.labResultsTemplate = [];
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    }
}
