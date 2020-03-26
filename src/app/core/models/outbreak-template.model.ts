import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreakTemplate, IPermissionQuestionnaire } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class OutbreakTemplateModel
    implements
        IPermissionBasic,
        IPermissionQuestionnaire,
        IPermissionOutbreakTemplate,
        IPermissionCloneable {
    id: string;
    name: string;
    disease: string;
    periodOfFollowup: number;
    frequencyOfFollowUpPerDay: number;
    noDaysAmongContacts: number;
    noDaysInChains: number;
    noDaysNotSeen: number;
    noLessContacts: number;
    noDaysNewContacts: number;
    longPeriodsBetweenCaseOnset: number;
    caseInvestigationTemplate: QuestionModel[];
    contactFollowUpTemplate: QuestionModel[];
    labResultsTemplate: QuestionModel[];
    isContactLabResultsActive: boolean;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_VIEW, PERMISSION.OUTBREAK_TEMPLATE_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_DELETE) : false; }

    /**
     * Static Permissions - IPermissionQuestionnaire
     */
    static canModifyCaseQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_QUESTIONNAIRE) : false; }
    static canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE) : false; }
    static canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE) : false; }

    /**
     * Static Permissions - IPermissionOutbreakTemplate
     */
    static canGenerateOutbreak(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_CREATE, PERMISSION.OUTBREAK_TEMPLATE_VIEW, PERMISSION.OUTBREAK_TEMPLATE_GENERATE_OUTBREAK) : false; }

    /**
     * Static Permissions - IPermissionsCloneable
     */
    static canClone(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_CREATE_CLONE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.disease = _.get(data, 'disease');
        this.periodOfFollowup = _.get(data, 'periodOfFollowup');
        this.frequencyOfFollowUpPerDay = _.get(data, 'frequencyOfFollowUpPerDay');
        this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
        this.noDaysInChains = _.get(data, 'noDaysInChains');
        this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
        this.noLessContacts = _.get(data, 'noLessContacts');
        this.noDaysNewContacts = _.get(data, 'noDaysNewContacts', 1);
        this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
        this.isContactLabResultsActive = _.get(data, 'isContactLabResultsActive', false);
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
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return OutbreakTemplateModel.canView(user); }
    canList(user: UserModel): boolean { return OutbreakTemplateModel.canList(user); }
    canCreate(user: UserModel): boolean { return OutbreakTemplateModel.canCreate(user); }
    canModify(user: UserModel): boolean { return OutbreakTemplateModel.canModify(user); }
    canDelete(user: UserModel): boolean { return OutbreakTemplateModel.canDelete(user); }

    /**
     * Permissions - IPermissionQuestionnaire
     */
    canModifyCaseQuestionnaire(user: UserModel): boolean { return OutbreakTemplateModel.canModifyCaseQuestionnaire(user); }
    canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return OutbreakTemplateModel.canModifyContactFollowUpQuestionnaire(user); }
    canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return OutbreakTemplateModel.canModifyCaseLabResultQuestionnaire(user); }

    /**
     * Permissions - IPermissionOutbreakTemplate
     */
    canGenerateOutbreak(user: UserModel): boolean { return OutbreakTemplateModel.canGenerateOutbreak(user); }

    /**
     * Permissions - IPermissionCloneable
     */
    canClone(user: UserModel): boolean { return OutbreakTemplateModel.canClone(user); }
}
