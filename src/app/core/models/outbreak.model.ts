import * as _ from 'lodash';
import { QuestionModel } from './question.model';
import { LocationModel } from './location.model';
import { MapServerModel } from './map-server.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionOutbreak, IPermissionQuestionnaire, IPermissionRestorable } from './permission.interface';
import { Constants } from './constants';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { Moment } from '../helperClasses/x-moment';
import {
  ITreeEditorDataValue
} from '../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';

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
  contactFollowUpTemplate: QuestionModel[];
  labResultsTemplate: QuestionModel[];
  eventIdMask: string;
  caseIdMask: string;
  contactIdMask: string;
  contactOfContactIdMask: string;
  allowedRefDataItems: ITreeEditorDataValue;

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
  isDateOfOnsetRequired: boolean;
  applyGeographicRestrictions: boolean;
  checkLastContactDateAgainstDateOnSet: boolean;
  disableModifyingLegacyQuestionnaire: boolean;

  generateFollowUpsOverwriteExisting: boolean;
  generateFollowUpsKeepTeamAssignment: boolean;
  generateFollowUpsTeamAssignmentAlgorithm: string;
  generateFollowUpsDateOfLastContact: boolean;

  // used for displaying information when hovering an outbreak from topnav component
  // no need to save this one in the database
  details: string;

  // countries array
  private _countryIds: string[];
  get countryIds(): string[] {
    return this._countryIds;
  }

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    authUser: UserModel,
    options: {
      disease: ILabelValuePairModel[],
      country: ILabelValuePairModel[],
      geographicalLevel: ILabelValuePairModel[],
      followUpGenerationTeamAssignmentAlgorithm: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_OUTBREAK_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'disease',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
        options: data.options.disease,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'checkLastContactDateAgainstDateOnSet',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'disableModifyingLegacyQuestionnaire',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'countries.id',
        label: 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES',
        options: data.options.country,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'reportingGeographicalLevelId',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL',
        options: data.options.geographicalLevel,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'startDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_START_DATE',
        sortable: true,
        havingNotHavingApplyMongo: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'endDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_END_DATE',
        sortable: true,
        havingNotHavingApplyMongo: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        options: data.options.followUpGenerationTeamAssignmentAlgorithm,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactLabResultsActive',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfOnsetRequired',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'locationIds',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'eventIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_EVENT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'caseIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'contactIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'contactOfContactIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'applyGeographicRestrictions',
        label: 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactsOfContactsActive',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_OF_CONTACT_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'periodOfFollowup',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'frequencyOfFollowUpPerDay',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'intervalOfFollowUp',
        label: 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysAmongContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysInChains',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNotSeen',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NOT_SEEN',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noLessContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LESS_THAN_X_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'longPeriodsBetweenCaseOnset',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_LONG_PERIODS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNewContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return advancedFilters;
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
    this.isDateOfOnsetRequired = _.get(data, 'isDateOfOnsetRequired', true);
    this.applyGeographicRestrictions = _.get(data, 'applyGeographicRestrictions', false);
    this.checkLastContactDateAgainstDateOnSet = _.get(data, 'checkLastContactDateAgainstDateOnSet', false);
    this.disableModifyingLegacyQuestionnaire = _.get(data, 'disableModifyingLegacyQuestionnaire', false);
    this.generateFollowUpsOverwriteExisting = _.get(data, 'generateFollowUpsOverwriteExisting', false);
    this.generateFollowUpsKeepTeamAssignment = _.get(data, 'generateFollowUpsKeepTeamAssignment', true);
    this.generateFollowUpsTeamAssignmentAlgorithm = _.get(data, 'generateFollowUpsTeamAssignmentAlgorithm', Constants.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM.ROUND_ROBIN_ALL_TEAMS.value);
    this.generateFollowUpsDateOfLastContact = _.get(data, 'generateFollowUpsDateOfLastContact', false);
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
