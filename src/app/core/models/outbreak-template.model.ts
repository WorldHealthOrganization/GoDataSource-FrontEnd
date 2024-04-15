import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreakTemplate, IPermissionQuestionnaire } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { Constants } from './constants';
import { BaseModel } from './base.model';
import {
  ITreeEditorDataValue
} from '../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';
import { IVisibleMandatoryDataValue } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

export class OutbreakTemplateModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionQuestionnaire,
    IPermissionOutbreakTemplate,
    IPermissionCloneable {
  id: string;
  name: string;
  description: string;
  disease: string;
  periodOfFollowup: number;
  frequencyOfFollowUpPerDay: number;
  intervalOfFollowUp: string;
  noDaysAmongContacts: number;
  noDaysInChains: number;
  noDaysNotSeen: number;
  noLessContacts: number;
  noDaysNewContacts: number;
  longPeriodsBetweenCaseOnset: number;
  caseInvestigationTemplate: QuestionModel[];
  contactInvestigationTemplate: QuestionModel[];
  eventInvestigationTemplate: QuestionModel[];
  caseFollowUpTemplate: QuestionModel[];
  contactFollowUpTemplate: QuestionModel[];
  labResultsTemplate: QuestionModel[];
  isContactLabResultsActive: boolean;
  isContactsOfContactsActive: boolean;
  applyGeographicRestrictions: boolean;
  checkLastContactDateAgainstDateOnSet: boolean;
  disableModifyingLegacyQuestionnaire: boolean;

  generateFollowUpsOverwriteExisting: boolean;
  generateFollowUpsKeepTeamAssignment: boolean;
  generateFollowUpsTeamAssignmentAlgorithm: string;
  generateFollowUpsDateOfLastContact: boolean;
  generateFollowUpsWhenCreatingContacts: boolean;

  // case follow-ups
  allowCasesFollowUp: boolean;
  periodOfFollowupCases: number;
  frequencyOfFollowUpPerDayCases: number;
  intervalOfFollowUpCases: string;
  generateFollowUpsOverwriteExistingCases: boolean;
  generateFollowUpsKeepTeamAssignmentCases: boolean;
  generateFollowUpsTeamAssignmentAlgorithmCases: string;
  generateFollowUpsDateOfOnset: boolean;
  generateFollowUpsWhenCreatingCases: boolean;

  allowedRefDataItems: ITreeEditorDataValue;
  visibleAndMandatoryFields: IVisibleMandatoryDataValue;

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
  static canModifyContactQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_QUESTIONNAIRE) : false; }
  static canModifyEventQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_EVENT_QUESTIONNAIRE) : false; }
  static canModifyCaseFollowUpQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_FOLLOW_UP_QUESTIONNAIRE) : false; }
  static canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE) : false; }
  static canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE) : false; }

  /**
   * Static Permissions - IPermissionOutbreakTemplate
   */
  static canGenerateOutbreak(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_CREATE, PERMISSION.OUTBREAK_TEMPLATE_VIEW, PERMISSION.OUTBREAK_TEMPLATE_GENERATE_OUTBREAK) : false; }

  /**
   * Static Permissions - IPermissionCloneable
   */
  static canClone(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_TEMPLATE_CREATE_CLONE) : false; }

  /**
   * Constructor
   */
  constructor(data = null) {
    super(data);

    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.description = _.get(data, 'description');
    this.disease = _.get(data, 'disease');
    this.periodOfFollowup = _.get(data, 'periodOfFollowup');
    this.frequencyOfFollowUpPerDay = _.get(data, 'frequencyOfFollowUpPerDay');
    this.intervalOfFollowUp = _.get(data, 'intervalOfFollowUp');
    this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
    this.noDaysInChains = _.get(data, 'noDaysInChains');
    this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
    this.noLessContacts = _.get(data, 'noLessContacts');
    this.noDaysNewContacts = _.get(data, 'noDaysNewContacts', 1);
    this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    this.isContactLabResultsActive = _.get(data, 'isContactLabResultsActive', false);
    this.isContactsOfContactsActive = _.get(data, 'isContactsOfContactsActive', false);
    this.applyGeographicRestrictions = _.get(data, 'applyGeographicRestrictions', false);
    this.checkLastContactDateAgainstDateOnSet = _.get(data, 'checkLastContactDateAgainstDateOnSet', false);
    this.disableModifyingLegacyQuestionnaire = _.get(data, 'disableModifyingLegacyQuestionnaire', false);
    this.allowCasesFollowUp = _.get(data, 'allowCasesFollowUp', false);
    this.generateFollowUpsOverwriteExisting = _.get(data, 'generateFollowUpsOverwriteExisting', false);
    this.generateFollowUpsKeepTeamAssignment = _.get(data, 'generateFollowUpsKeepTeamAssignment', true);
    this.generateFollowUpsTeamAssignmentAlgorithm = _.get(data, 'generateFollowUpsTeamAssignmentAlgorithm', Constants.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM.ROUND_ROBIN_ALL_TEAMS.value);
    this.generateFollowUpsDateOfLastContact = _.get(data, 'generateFollowUpsDateOfLastContact', false);
    this.generateFollowUpsWhenCreatingCases = _.get(data, 'generateFollowUpsWhenCreatingCases', false);
    this.generateFollowUpsWhenCreatingContacts = _.get(data, 'generateFollowUpsWhenCreatingContacts', false);
    this.allowedRefDataItems = _.get(data, 'allowedRefDataItems');

    // case follow-ups
    this.allowCasesFollowUp = _.get(data, 'allowCasesFollowUp', false);
    this.periodOfFollowupCases = _.get(data, 'periodOfFollowupCases');
    this.frequencyOfFollowUpPerDayCases = _.get(data, 'frequencyOfFollowUpPerDayCases');
    this.intervalOfFollowUpCases = _.get(data, 'intervalOfFollowUpCases');
    this.generateFollowUpsOverwriteExistingCases = _.get(data, 'generateFollowUpsOverwriteExistingCases', false);
    this.generateFollowUpsKeepTeamAssignmentCases = _.get(data, 'generateFollowUpsKeepTeamAssignmentCases', true);
    this.generateFollowUpsTeamAssignmentAlgorithmCases = _.get(data, 'generateFollowUpsTeamAssignmentAlgorithmCases', Constants.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM.ROUND_ROBIN_ALL_TEAMS.value);
    this.generateFollowUpsDateOfOnset = _.get(data, 'generateFollowUpsDateOfOnset', false);
    this.generateFollowUpsWhenCreatingCases = _.get(data, 'generateFollowUpsWhenCreatingCases', false);

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
    // EVENT TEMPLATE
    this.eventInvestigationTemplate = _.map(
      _.get(data, 'eventInvestigationTemplate', []),
      (lData: any) => {
        return new QuestionModel(lData);
      });
    // CASE FOLLOW_UP INVESTIGATION TEMPLATE
    this.caseFollowUpTemplate = _.map(
      _.get(data, 'caseFollowUpTemplate', []),
      (lData: any) => {
        return new QuestionModel(lData);
      });
    // CONTACT FOLLOW_UP INVESTIGATION TEMPLATE
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

    // visible / mandatory fields
    // default values are configured later after initialization where necessary (create/modify outbreak, retrieve selected outbreak)
    this.visibleAndMandatoryFields = _.get(data, 'visibleAndMandatoryFields');

    // reconstruct property names
    if (
      this.visibleAndMandatoryFields &&
      Object.keys(this.visibleAndMandatoryFields).length > 0
    ) {
      this.visibleAndMandatoryFields = JSON.parse(JSON.stringify(this.visibleAndMandatoryFields).replace(new RegExp(Constants.DEFAULT_DB_DOT_REPLACER, 'g'), '.'));
    }
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
  canModifyContactQuestionnaire(user: UserModel): boolean { return OutbreakTemplateModel.canModifyContactQuestionnaire(user); }
  canModifyEventQuestionnaire(user: UserModel): boolean { return OutbreakTemplateModel.canModifyEventQuestionnaire(user); }
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
