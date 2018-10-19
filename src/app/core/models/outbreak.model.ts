import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import * as moment from 'moment';

export class OutbreakModel {
    id: string;
    name: string;
    description: string;
    disease: string;
    deleted: boolean;
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
    countries: {
        id: string
    }[];
    locations: {
        id: string
    }[];
    longPeriodsBetweenCaseOnset: number;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
        this.deleted = _.get(data, 'deleted');
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.countries = _.get(data, 'countries', []);
        this.locations = _.get(data, 'locations', []);
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUp = _.get(data, 'frequencyOfFollowUp');
        this.frequencyOfFollowUpPerDay = _.get(data, 'frequencyOfFollowUpPerDay');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysInChains = _.get(data, 'noDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        this.noDaysNewContacts = _.get(data, 'noDaysNewContacts', 1);
        // TODO read from reference data
        // this.caseClassification = [{"test": "test"}];
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');

        this.caseInvestigationTemplate = _.map(
            _.get(data, 'caseInvestigationTemplate', []),
            (lData: any) => {
               return new QuestionModel(lData);
            });
        this.contactFollowUpTemplate = _.map(
            _.get(data, 'contactFollowUpTemplate', []),
            (lData: any) => {
                return new QuestionModel(lData);
            });
        this.labResultsTemplate = _.map(
            _.get(data, 'labResultsTemplate', []),
            (lData: any) => {
                return new QuestionModel(lData);
            });
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
        return caseIdMask.replace(/YYYY/g, moment().format('YYYY'));
    }
}
