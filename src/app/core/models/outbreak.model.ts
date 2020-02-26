import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { LocationModel } from './location.model';
import { MapServerModel } from './map-server.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreak, IPermissionQuestionnaire, IPermissionRestorable } from './permission.interface';

export class OutbreakModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionOutbreak,
        IPermissionQuestionnaire,
        IPermissionCloneable,
        IPermissionRestorable {
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
    contactInvestigationTemplate: QuestionModel[];
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
    isContactLabResultsActive: boolean;

    // used for displaying information when hovering an outbreak from topnav component
    // no need to save this one in the database
    details: string;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_VIEW, PERMISSION.OUTBREAK_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_DELETE) : false; }

    /**
     * Static Permissions - IPermissionRestorable
     */
    static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_RESTORE) : false; }

    /**
     * Static Permissions - IPermissionOutbreak
     */
    static canMakeOutbreakActive(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MAKE_ACTIVE) : false; }
    static canSeeInconsistencies(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_SEE_INCONSISTENCIES) : false; }

    /**
     * Static Permissions - IPermissionQuestionnaire
     */
    static canModifyCaseQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CASE_QUESTIONNAIRE) : false; }
    static canModifyContactQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CONTACT_QUESTIONNAIRE) : false; }
    static canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE) : false; }
    static canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE) : false; }

    /**
     * Static Permissions - IPermissionCloneable
     */
    static canClone(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_CREATE_CLONE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.disease = _.get(data, 'disease');
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
        this.caseIdMask = _.get(data, 'caseIdMask');
        this.contactIdMask = _.get(data, 'contactIdMask');
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
        this.isContactLabResultsActive = _.get(data, 'isContactLabResultsActive', false);

        // CASE INVESTIGATION TEMPLATE
        this.caseInvestigationTemplate = _.map(
            _.get(data, 'caseInvestigationTemplate', []),
            (lData: any) => {
               return new QuestionModel(lData);
            });
        // CONTACT INVESTIGATION TEMPLATE
        this.contactInvestigationTemplate = _.map(
            _.get(data, 'contactInvestigationTemplate', []),
            (lData: any) => {
                return new QuestionModel(lData);
            });
        // CONTACT FOLLOW_UP INVESTIGATIONS TEMPLATE
        this.contactFollowUpTemplate = _.map(
            _.get(data, 'contactFollowUpTemplate', []),
            (lData: any) => {
                return new QuestionModel(lData);
            });
        // LAB RESULT TEMPLATE
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

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return OutbreakModel.canView(user); }
    canList(user: UserModel): boolean { return OutbreakModel.canList(user); }
    canCreate(user: UserModel): boolean { return OutbreakModel.canCreate(user); }
    canModify(user: UserModel): boolean { return OutbreakModel.canModify(user); }
    canDelete(user: UserModel): boolean { return OutbreakModel.canDelete(user); }

    /**
     * Permissions - IPermissionRestorable
     */
    canRestore(user: UserModel): boolean { return OutbreakModel.canRestore(user); }

    /**
     * Permissions - IPermissionOutbreak
     */
    canMakeOutbreakActive(user: UserModel): boolean { return OutbreakModel.canMakeOutbreakActive(user); }
    canSeeInconsistencies(user: UserModel): boolean { return OutbreakModel.canSeeInconsistencies(user); }

    /**
     * Permissions - IPermissionQuestionnaire
     */
    canModifyCaseQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyCaseQuestionnaire(user); }
    canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyContactFollowUpQuestionnaire(user); }
    canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyCaseLabResultQuestionnaire(user); }

    /**
     * Permissions - IPermissionCloneable
     */
    canClone(user: UserModel): boolean { return OutbreakModel.canClone(user); }
}
