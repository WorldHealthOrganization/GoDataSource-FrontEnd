import * as _ from 'lodash';
import { QuestionModel } from './question.model';

export class OutbreakModel {
    id: string;
    name: string;
    description: string;
    disease: string;
    startDate: string;
    endDate: string | null;
    periodOfFollowup: number;
    frequencyOfFollowUp: number;
    frequencyOfFollowUpPerDay: number;
    noDaysAmongContacts: number;
    noDaysInChains: number;
    noDaysNotSeen: number;
    noLessContacts: number;
    noDaysNewContacts: number;
    caseInvestigationTemplate: QuestionModel[];
    contactFollowUpTemplate: QuestionModel[];
    labResultsTemplate: QuestionModel[];
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
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.countries = _.get(data, 'countries');
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUp = _.get(data, 'frequencyOfFollowUp');
        this.frequencyOfFollowUpPerDay = _.get(data, 'frequencyOfFollowUpPerDay');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysInChains = _.get(data, 'noDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        this.noDaysNewContacts = _.get(data, 'noDaysNewContacts');
        // TODO read from reference data
        // this.caseClassification = [{"test": "test"}];
        this.caseInvestigationTemplate = _.get(data, 'caseInvestigationTemplate', []);
        this.contactFollowUpTemplate = _.get(data, 'contactFollowUpTemplate', []);
        this.labResultsTemplate = _.get(data, 'labResultsTemplate', []);
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    }
}
