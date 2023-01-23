import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreakTemplate, IPermissionQuestionnaire } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { Constants } from './constants';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { BaseModel } from './base.model';

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
  contactFollowUpTemplate: QuestionModel[];
  labResultsTemplate: QuestionModel[];
  isContactLabResultsActive: boolean;
  isContactsOfContactsActive: boolean;
  isDateOfOnsetRequired: boolean;
  applyGeographicRestrictions: boolean;
  checkLastContactDateAgainstDateOnSet: boolean;

  generateFollowUpsOverwriteExisting: boolean;
  generateFollowUpsKeepTeamAssignment: boolean;
  generateFollowUpsTeamAssignmentAlgorithm: string;
  generateFollowUpsDateOfLastContact: boolean;

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    options: {
      disease: ILabelValuePairModel[],
      followUpGenerationTeamAssignmentAlgorithm: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'disease',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISEASE',
        options: data.options.disease,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'checkLastContactDateAgainstDateOnSet',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        options: data.options.followUpGenerationTeamAssignmentAlgorithm,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        options: data.options.yesNo,
        sortable: true
      }
    ];

    // finished
    return advancedFilters;
  }

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
    this.isDateOfOnsetRequired = _.get(data, 'isDateOfOnsetRequired', true);
    this.applyGeographicRestrictions = _.get(data, 'applyGeographicRestrictions', false);
    this.checkLastContactDateAgainstDateOnSet = _.get(data, 'checkLastContactDateAgainstDateOnSet', false);
    this.generateFollowUpsOverwriteExisting = _.get(data, 'generateFollowUpsOverwriteExisting', false);
    this.generateFollowUpsKeepTeamAssignment = _.get(data, 'generateFollowUpsKeepTeamAssignment', true);
    this.generateFollowUpsTeamAssignmentAlgorithm = _.get(data, 'generateFollowUpsTeamAssignmentAlgorithm', Constants.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM.ROUND_ROBIN_ALL_TEAMS.value);
    this.generateFollowUpsDateOfLastContact = _.get(data, 'generateFollowUpsDateOfLastContact', false);

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
