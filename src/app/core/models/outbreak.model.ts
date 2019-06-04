import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { LocationModel } from './location.model';
import { MapServerModel } from './map-server.model';

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
    contactIdMask: string;
    countries: {
        id: string
    }[];
    locationIds: string[];
    locations: LocationModel[] = [];
    longPeriodsBetweenCaseOnset: number;
    reportingGeographicalLevelId: string;
    arcGisServers: MapServerModel[];

    // used for displaying information when hovering an outbreak from topnav component
    // no need to save this one in the database
    details: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
        this.deleted = _.get(data, 'deleted');
        this.startDate = _.get(data, 'startDate');
        this.endDate = _.get(data, 'endDate');
        this.countries = _.get(data, 'countries', []);
        this.locationIds = _.get(data, 'locationIds', []);
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUp = _.get(data, 'frequencyOfFollowUp');
        this.frequencyOfFollowUpPerDay = _.get(data, 'frequencyOfFollowUpPerDay');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysInChains = _.get(data, 'noDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        this.noDaysNewContacts = _.get(data, 'noDaysNewContacts', 1);
        this.reportingGeographicalLevelId = _.get(data, 'reportingGeographicalLevelId', '');
        // TODO read from reference data
        // this.caseClassification = [{"test": "test"}];
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.contactIdMask = _.get(data, 'contactIdMask');
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

        // map servers
        this.arcGisServers = _.map(
            _.get(data, 'arcGisServers', []),
            (lData: any) => {
                return new MapServerModel(lData);
            });
    }
}
