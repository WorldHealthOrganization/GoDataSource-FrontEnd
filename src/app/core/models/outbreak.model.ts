import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { LocationModel } from './location.model';
import { MapServerModel } from './map-server.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreak, IPermissionQuestionnaire, IPermissionRestorable } from './permission.interface';
import { Constants } from './constants';
import { Moment } from '../helperClasses/x-moment';
import {
  ITreeEditorDataValue
} from '../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';
import { IVisibleMandatoryDataValue } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

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
  startDate: string | Moment;
  endDate: string | Moment;
  periodOfFollowup: number;
  frequencyOfFollowUp: number;
  frequencyOfFollowUpPerDay: number;
  intervalOfFollowUp: string;
  noDaysAmongContacts: number;
  noDaysInChains: number;
  noDaysNotSeen: number;
  noLessContacts: number;
  noDaysNewContacts: number;
  caseInvestigationTemplate: QuestionModel[];
  contactInvestigationTemplate: QuestionModel[];
  eventInvestigationTemplate: QuestionModel[];
  contactFollowUpTemplate: QuestionModel[];
  labResultsTemplate: QuestionModel[];
  eventIdMask: string;
  caseIdMask: string;
  contactIdMask: string;
  contactOfContactIdMask: string;
  allowedRefDataItems: ITreeEditorDataValue;
  visibleAndMandatoryFields: IVisibleMandatoryDataValue;

  // countries
  private _countries: {
    id: string
  }[];
  set countries(countries: {
    id: string
  }[]) {
    // set value
    this._countries = countries;

    // update ids
    this._countryIds = (this.countries || []).map((item) => item.id);
  }
  get countries(): {
    id: string
  }[] {
    return this._countries;
  }

  locationIds: string[];
  locations: LocationModel[] = [];
  longPeriodsBetweenCaseOnset: number;
  reportingGeographicalLevelId: string;
  arcGisServers: MapServerModel[];
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

  // used for displaying information when hovering an outbreak from topnav component
  // no need to save this one in the database
  details: string;

  // countries array
  private _countryIds: string[];
  get countryIds(): string[] {
    return this._countryIds;
  }

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
  static canImportRelationship(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_IMPORT_RELATIONSHIP) : false; }

  /**
   * Static Permissions - IPermissionQuestionnaire
   */
  static canModifyCaseQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CASE_QUESTIONNAIRE) : false; }
  static canModifyContactQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_CONTACT_QUESTIONNAIRE) : false; }
  static canModifyEventQuestionnaire(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.OUTBREAK_MODIFY_EVENT_QUESTIONNAIRE) : false; }
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
    this.intervalOfFollowUp = _.get(data, 'intervalOfFollowUp');
    this.noDaysAmongContacts = _.get(data, 'noDaysAmongContacts');
    this.noDaysInChains = _.get(data, 'noDaysInChains');
    this.noDaysNotSeen = _.get(data, 'noDaysNotSeen');
    this.noLessContacts = _.get(data, 'noLessContacts');
    this.noDaysNewContacts = _.get(data, 'noDaysNewContacts', 1);
    this.reportingGeographicalLevelId = _.get(data, 'reportingGeographicalLevelId', '');
    this.eventIdMask = _.get(data, 'eventIdMask');
    this.caseIdMask = _.get(data, 'caseIdMask');
    this.contactIdMask = _.get(data, 'contactIdMask');
    this.contactOfContactIdMask = _.get(data, 'contactOfContactIdMask');
    this.longPeriodsBetweenCaseOnset = _.get(data, 'longPeriodsBetweenCaseOnset');
    this.isContactLabResultsActive = _.get(data, 'isContactLabResultsActive', false);
    this.isContactsOfContactsActive = _.get(data, 'isContactsOfContactsActive', false);
    this.applyGeographicRestrictions = _.get(data, 'applyGeographicRestrictions', false);
    this.checkLastContactDateAgainstDateOnSet = _.get(data, 'checkLastContactDateAgainstDateOnSet', false);
    this.disableModifyingLegacyQuestionnaire = _.get(data, 'disableModifyingLegacyQuestionnaire', false);
    this.generateFollowUpsOverwriteExisting = _.get(data, 'generateFollowUpsOverwriteExisting', false);
    this.generateFollowUpsKeepTeamAssignment = _.get(data, 'generateFollowUpsKeepTeamAssignment', true);
    this.generateFollowUpsTeamAssignmentAlgorithm = _.get(data, 'generateFollowUpsTeamAssignmentAlgorithm', Constants.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM.ROUND_ROBIN_ALL_TEAMS.value);
    this.generateFollowUpsDateOfLastContact = _.get(data, 'generateFollowUpsDateOfLastContact', false);
    this.generateFollowUpsWhenCreatingContacts = _.get(data, 'generateFollowUpsWhenCreatingContacts', false);
    this.allowedRefDataItems = _.get(data, 'allowedRefDataItems');

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
  canImportRelationship(user: UserModel): boolean { return OutbreakModel.canSeeInconsistencies(user); }

  /**
   * Permissions - IPermissionQuestionnaire
   */
  canModifyCaseQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyCaseQuestionnaire(user); }
  canModifyContactQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyContactQuestionnaire(user); }
  canModifyContactFollowUpQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyContactFollowUpQuestionnaire(user); }
  canModifyCaseLabResultQuestionnaire(user: UserModel): boolean { return OutbreakModel.canModifyCaseLabResultQuestionnaire(user); }

  /**
   * Permissions - IPermissionCloneable
   */
  canClone(user: UserModel): boolean { return OutbreakModel.canClone(user); }
}
