import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { Moment, moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { VaccineModel } from './vaccine.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import {
  IPermissionBasic,
  IPermissionBasicBulk,
  IPermissionChronology,
  IPermissionContact,
  IPermissionExportable,
  IPermissionImportable,
  IPermissionMovement,
  IPermissionRelatedLabResult,
  IPermissionRelatedRelationship,
  IPermissionRestorable,
  IPermissionRelatedContactOfContactBulk,
  IPermissionRelatedContactOfContact
} from './permission.interface';
import { IAnswerData, QuestionModel } from './question.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { TeamModel } from './team.model';
import { FollowUpModel } from './follow-up.model';
import { RequestQueryBuilder } from '../helperClasses/request-query-builder';
import { CaseModel } from './case.model';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { IResolverV2ResponseModel } from '../services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from './reference-data.model';
import { SafeHtml } from '@angular/platform-browser';
import { I18nService } from '../services/helper/i18n.service';

export interface IFollowUpHistory {
  startDate: string;
  endDate: string;
  status: string;
}

export class ContactModel
  extends BaseModel
  implements
        IPermissionBasic,
        IPermissionExportable,
        IPermissionImportable,
        IPermissionBasicBulk,
        IPermissionRelatedContactOfContactBulk,
        IPermissionRestorable,
        IPermissionRelatedRelationship,
        IPermissionMovement,
        IPermissionChronology,
        IPermissionContact,
        IPermissionRelatedLabResult,
        IPermissionRelatedContactOfContact {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  occupation: string;
  documents: DocumentModel[];
  addresses: AddressModel[];
  riskLevel: string;
  riskReason: string;
  type: EntityType = EntityType.CONTACT;
  dateOfReporting: string | Moment;
  dateOfLastContact: string;
  isDateOfReportingApproximate: boolean;
  outbreakId: string;
  visualId: string;

  wasCase: boolean;
  dateBecomeCase: string | Moment;
  wasContact: string;
  dateBecomeContact: string | Moment;
  wasContactOfContact: boolean;
  dateBecomeContactOfContact: string | Moment;

  numberOfContacts: number;
  numberOfExposures: number;

  followUp: {
    originalStartDate: string,
    startDate: string,
    endDate: string,
    status: string
  };

  followUpHistory: IFollowUpHistory[];

  followUpTeamId: string;

  responsibleUserId: string;
  responsibleUser: UserModel;

  dob: string | Moment;
  age: AgeModel;

  vaccinesReceived: VaccineModel[];
  pregnancyStatus: string;

  questionnaireAnswers: {
    [variable: string]: IAnswerData[];
  };

  questionnaireAnswersCase: {
    [variable: string]: IAnswerData[];
  };

  inconsistencies: InconsistencyModel[];

  alerted: boolean = false;
  relationship: any;

  matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

  // used by ui
  uiStatusForms: SafeHtml;

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    authUser: UserModel,
    contactInvestigationTemplate: () => QuestionModel[],
    contactFollowUpTemplate: () => QuestionModel[],
    caseInvestigationTemplate: () => QuestionModel[],
    options: {
      occupation: ILabelValuePairModel[],
      followUpStatus: ILabelValuePairModel[],
      pregnancyStatus: ILabelValuePairModel[],
      vaccine: ILabelValuePairModel[],
      vaccineStatus: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      team: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      dailyFollowUpStatus: ILabelValuePairModel[],
      gender: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // Contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        options: data.options.occupation,
        sortable: true
      },
      {
        field: 'gender',
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
        type: V2AdvancedFilterType.MULTISELECT,
        options: data.options.gender
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateBecomeContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUp.status',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        options: data.options.followUpStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'followUp.endDate',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: data.contactInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        options: data.options.pregnancyStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE',
        options: data.options.vaccine
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        options: data.options.vaccineStatus
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_DATE'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasCase',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContactOfContact',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      }
    ];

    // allowed to filter by follow-up team ?
    if (TeamModel.canList(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUpTeamId',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        options: data.options.team
      });
    }

    // allowed to filter by follow-up user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user
      });
    }

    // Relation - Follow-up
    if (FollowUpModel.canList(data.authUser)) {
      advancedFilters.push(
        {
          field: 'date',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
          type: V2AdvancedFilterType.RANGE_DATE,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'index',
          label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
          type: V2AdvancedFilterType.RANGE_NUMBER,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'targeted',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
          type: V2AdvancedFilterType.SELECT,
          options: data.options.yesNo,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'statusId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
          type: V2AdvancedFilterType.MULTISELECT,
          options: data.options.dailyFollowUpStatus,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'questionnaireAnswers',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          template: data.contactFollowUpTemplate,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        }
      );
    }

    // case condition
    const caseCondition = new RequestQueryBuilder();
    caseCondition.filter.byEquality(
      'type',
      EntityType.CASE
    );

    // Relation - Cases
    if (CaseModel.canList(data.authUser)) {
      advancedFilters.push(
        {
          field: 'firstName',
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          type: V2AdvancedFilterType.TEXT,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'lastName',
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          type: V2AdvancedFilterType.TEXT,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'gender',
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          type: V2AdvancedFilterType.MULTISELECT,
          options: data.options.gender,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'age',
          label: 'LNG_CASE_FIELD_LABEL_AGE',
          type: V2AdvancedFilterType.RANGE_AGE,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'questionnaireAnswers',
          label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          template: data.caseInvestigationTemplate,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        }
      );
    }

    // finished
    return advancedFilters;
  }

  /**
   * Retrieve statuses forms
   */
  static getStatusForms(
    info: {
      // required
      item: ContactModel,
      i18nService: I18nService,
      risk: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // risk
    if (
      info.item.riskLevel &&
      info.risk.map[info.item.riskLevel]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.TRIANGLE,
        color: info.risk.map[info.item.riskLevel].getColorCode(),
        tooltip: info.i18nService.instant(info.item.riskLevel)
      });
    }

    // as per current date
    if (
      info.item.followUp?.startDate &&
      moment().isSameOrBefore(info.item.followUp?.startDate)
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-follow-up-not-started)',
        tooltip: info.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_NOT_STARTED')
      });
    } else if (
      info.item.followUp?.startDate &&
      info.item.followUp?.endDate &&
      moment().isBetween(
        info.item.followUp?.startDate,
        info.item.followUp?.endDate,
        undefined,
        '[]'
      )
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-under-follow-up)',
        tooltip: info.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_UNDER_FOLLOW_UP')
      });
    } else if (
      info.item.followUp?.endDate &&
      moment().isSameOrAfter(info.item.followUp?.endDate)
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.SQUARE,
        color: 'var(--gd-status-follow-up-ended)',
        tooltip: info.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_ENDED_FOLLOW_UP')
      });
    }

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: info.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    }

    // finished
    return forms;
  }

  /**
   * Return contact id mask with data replaced
   */
  static generateContactIDMask(contactIdMask: string): string {
    // validate
    if (_.isEmpty(contactIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return contactIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW, PERMISSION.CONTACT_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_DELETE) : false); }

  /**
     * Static Permissions - IPermissionExportable
     */
  static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT) : false); }

  /**
     * Static Permissions - IPermissionImportable
     */
  static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_IMPORT) : false); }

  /**
     * Static Permissions - IPermissionBasicBulk
     */
  static canBulkCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_BULK_CREATE) : false); }
  static canBulkModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_BULK_MODIFY) : false); }
  static canBulkDelete(): boolean { return false; }
  static canBulkRestore(): boolean { return false; }

  /**
     * Static Permissions - IPermissionRelatedContactOfContactBulk
     */
  static canBulkCreateContactOfContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_BULK_CONTACT_OF_CONTACT) : false); }

  /**
     * Static Permissions - IPermissionRestorable
     */
  static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_RESTORE) : false); }

  /**
     * Static Permissions - IPermissionRelatedRelationship
     */
  static canListRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_LIST_RELATIONSHIP_CONTACTS) : false); }
  static canViewRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_RELATIONSHIP_CONTACTS) : false); }
  static canCreateRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_RELATIONSHIP_CONTACTS) : false); }
  static canModifyRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY_RELATIONSHIP_CONTACTS) : false); }
  static canDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canListRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_LIST_RELATIONSHIP_EXPOSURES) : false); }
  static canViewRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_RELATIONSHIP_EXPOSURES) : false); }
  static canCreateRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_RELATIONSHIP_EXPOSURES) : false); }
  static canModifyRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY_RELATIONSHIP_EXPOSURES) : false); }
  static canDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_DELETE_RELATIONSHIP_EXPOSURES) : false); }
  static canReverseRelationship(): boolean { return false; }
  static canListPersonsWithoutRelationships(): boolean { return false; }
  static canExportRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_RELATIONSHIPS) : false); }
  static canShareRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_SHARE_RELATIONSHIPS) : false); }
  static canChangeSource(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP) : false); }
  static canBulkDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_BULK_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canBulkDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_BULK_DELETE_RELATIONSHIP_EXPOSURES) : false); }

  /**
     * Static Permissions - IPermissionMovement
     */
  static canViewMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_MOVEMENT_MAP) : false); }
  static canExportMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_MOVEMENT_MAP) : false); }

  /**
     * Static Permissions - IPermissionChronology
     */
  static canViewChronologyChart(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_CHRONOLOGY_CHART) : false); }

  /**
     * Static Permissions - IPermissionContact
     */
  static canGenerateVisualId(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_GENERATE_VISUAL_ID) : false); }
  static canConvertToCase(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CONVERT_TO_CASE) : false); }
  static canConvertToContactOfContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CONVERT_TO_CONTACT_OF_CONTACT) : false); }
  static canExportDailyFollowUpList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_DAILY_FOLLOW_UP_LIST) : false); }
  static canExportDailyFollowUpsForm(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_DAILY_FOLLOW_UP_FORM) : false); }
  static canExportDossier(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_DOSSIER) : false); }

  /**
     * Static Permissions - IPermissionRelatedLabResult
     */
  static canViewLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_LAB_RESULT) : false); }
  static canListLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_LIST_LAB_RESULT) : false); }
  static canCreateLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_LAB_RESULT) : false); }
  static canModifyLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY_LAB_RESULT) : false); }
  static canDeleteLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_DELETE_LAB_RESULT) : false); }
  static canRestoreLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_RESTORE_LAB_RESULT) : false); }
  static canImportLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_IMPORT_LAB_RESULT) : false); }
  static canExportLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_EXPORT_LAB_RESULT) : false); }

  /**
     * Static Permissions - IPermissionRelatedContactOfContact
     */
  static canCreateContactOfContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_CONTACT_OF_CONTACT) : false); }

  /**
     * Constructor
     */
  constructor(data = null) {
    super(data);

    this.id = _.get(data, 'id');
    this.firstName = _.get(data, 'firstName');
    this.middleName = _.get(data, 'middleName');
    this.lastName = _.get(data, 'lastName');
    this.gender = _.get(data, 'gender');
    this.occupation = _.get(data, 'occupation');
    this.outbreakId = _.get(data, 'outbreakId');
    this.documents = _.get(data, 'documents', []);

    this.dob = _.get(data, 'dob');
    this.age = new AgeModel(_.get(data, 'age'));

    // address location
    const locationsList: any[] = _.get(data, 'locations', []);
    let locationsMap: {
      [locationId: string]: any
    };
    if (
      locationsList &&
      locationsList.length > 0
    ) {
      locationsMap = {};
      locationsList.forEach((location) => {
        // location exists anymore ?
        if (!location) {
          return;
        }

        // map location
        locationsMap[location.id] = location;
      });
    }
    this.addresses = _.map(
      _.get(data, 'addresses', []),
      (addressData) => {
        return new AddressModel(addressData, locationsMap);
      }
    );

    this.numberOfContacts = _.get(data, 'numberOfContacts');
    this.numberOfExposures = _.get(data, 'numberOfExposures');

    // vaccines received
    const vaccinesReceived = _.get(data, 'vaccinesReceived');
    this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
      return new VaccineModel(vaccineData);
    });
    this.pregnancyStatus = _.get(data, 'pregnancyStatus');

    this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    this.questionnaireAnswersCase = _.get(data, 'questionnaireAnswersCase', {});

    this.riskLevel = _.get(data, 'riskLevel');
    this.riskReason = _.get(data, 'riskReason');
    this.dateOfReporting = _.get(data, 'dateOfReporting');
    this.dateOfLastContact = _.get(data, 'dateOfLastContact');
    this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
    this.visualId = _.get(data, 'visualId', '');

    this.wasCase = _.get(data, 'wasCase', false);
    this.dateBecomeCase = _.get(data, 'dateBecomeCase');
    this.wasContact = _.get(data, 'wasContact', false);
    this.dateBecomeContact = _.get(data, 'dateBecomeContact');
    this.wasContactOfContact = _.get(data, 'wasContactOfContact', false);
    this.dateBecomeContactOfContact = _.get(data, 'dateBecomeContactOfContact');

    this.followUpTeamId = _.get(data, 'followUpTeamId');

    this.followUp = _.get(data, 'followUp', {});
    this.followUpHistory = _.get(data, 'followUpHistory', []);

    this.responsibleUserId = _.get(data, 'responsibleUserId');
    this.responsibleUser = _.get(data, 'responsibleUser');
    if (this.responsibleUser) {
      this.responsibleUser = new UserModel(this.responsibleUser);
    }

    this.inconsistencies = _.get(data, 'inconsistencies', []);
    _.each(this.inconsistencies, (inconsistency, index) => {
      this.inconsistencies[index] = new InconsistencyModel(inconsistency);
    });

    this.relationship = _.get(data, 'relationship');

    this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
    _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
      this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
    });
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return ContactModel.canView(user); }
  canList(user: UserModel): boolean { return ContactModel.canList(user); }
  canCreate(user: UserModel): boolean { return ContactModel.canCreate(user); }
  canModify(user: UserModel): boolean { return ContactModel.canModify(user); }
  canDelete(user: UserModel): boolean { return ContactModel.canDelete(user); }

  /**
     * Permissions - IPermissionExportable
     */
  canExport(user: UserModel): boolean { return ContactModel.canExport(user); }

  /**
     * Permissions - IPermissionImportable
     */
  canImport(user: UserModel): boolean { return ContactModel.canImport(user); }

  /**
     * Permissions - IPermissionBasicBulk
     */
  canBulkCreate(user: UserModel): boolean { return ContactModel.canBulkCreate(user); }
  canBulkModify(user: UserModel): boolean { return ContactModel.canBulkModify(user); }
  canBulkDelete(): boolean { return ContactModel.canBulkDelete(); }
  canBulkRestore(): boolean { return ContactModel.canBulkRestore(); }

  /**
     * Permissions - IPermissionRelatedContactOfContactBulk
     */
  canBulkCreateContactOfContact(user: UserModel): boolean { return ContactModel.canBulkCreateContactOfContact(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return ContactModel.canRestore(user); }

  /**
     * Permissions - IPermissionRelatedRelationship
     */
  canListRelationshipContacts(user: UserModel): boolean { return ContactModel.canListRelationshipContacts(user); }
  canViewRelationshipContacts(user: UserModel): boolean { return ContactModel.canViewRelationshipContacts(user); }
  canCreateRelationshipContacts(user: UserModel): boolean { return ContactModel.canCreateRelationshipContacts(user); }
  canModifyRelationshipContacts(user: UserModel): boolean { return ContactModel.canModifyRelationshipContacts(user); }
  canDeleteRelationshipContacts(user: UserModel): boolean { return ContactModel.canDeleteRelationshipContacts(user); }
  canListRelationshipExposures(user: UserModel): boolean { return ContactModel.canListRelationshipExposures(user); }
  canViewRelationshipExposures(user: UserModel): boolean { return ContactModel.canViewRelationshipExposures(user); }
  canCreateRelationshipExposures(user: UserModel): boolean { return ContactModel.canCreateRelationshipExposures(user); }
  canModifyRelationshipExposures(user: UserModel): boolean { return ContactModel.canModifyRelationshipExposures(user); }
  canDeleteRelationshipExposures(user: UserModel): boolean { return ContactModel.canDeleteRelationshipExposures(user); }
  canReverseRelationship(): boolean { return ContactModel.canReverseRelationship(); }
  canListPersonsWithoutRelationships(): boolean { return ContactModel.canListPersonsWithoutRelationships(); }
  canExportRelationships(user: UserModel): boolean { return ContactModel.canExportRelationships(user); }
  canShareRelationship(user: UserModel): boolean { return ContactModel.canShareRelationship(user); }
  canChangeSource(user: UserModel): boolean { return ContactModel.canChangeSource(user); }
  canBulkDeleteRelationshipContacts(user: UserModel): boolean { return ContactModel.canBulkDeleteRelationshipContacts(user); }
  canBulkDeleteRelationshipExposures(user: UserModel): boolean { return ContactModel.canBulkDeleteRelationshipExposures(user); }

  /**
     * Permissions - IPermissionMovement
     */
  canViewMovementMap(user: UserModel): boolean { return ContactModel.canViewMovementMap(user); }
  canExportMovementMap(user: UserModel): boolean { return ContactModel.canExportMovementMap(user); }

  /**
     * Permissions - IPermissionChronology
     */
  canViewChronologyChart(user: UserModel): boolean { return ContactModel.canViewChronologyChart(user); }

  /**
     * Permissions - IPermissionContact
     */
  canGenerateVisualId(user: UserModel): boolean { return ContactModel.canGenerateVisualId(user); }
  canConvertToCase(user: UserModel): boolean { return ContactModel.canConvertToCase(user); }
  canConvertToContactOfContact(user: UserModel): boolean { return ContactModel.canConvertToContactOfContact(user); }
  canExportDailyFollowUpList(user: UserModel): boolean { return ContactModel.canExportDailyFollowUpList(user); }
  canExportDailyFollowUpsForm(user: UserModel): boolean { return ContactModel.canExportDailyFollowUpsForm(user); }
  canExportDossier(user: UserModel): boolean { return ContactModel.canExportDossier(user); }

  /**
     * Permissions - IPermissionRelatedLabResult
     */
  canViewLabResult(user: UserModel): boolean { return ContactModel.canViewLabResult(user); }
  canListLabResult(user: UserModel): boolean { return ContactModel.canListLabResult(user); }
  canCreateLabResult(user: UserModel): boolean { return ContactModel.canCreateLabResult(user); }
  canModifyLabResult(user: UserModel): boolean { return ContactModel.canModifyLabResult(user); }
  canDeleteLabResult(user: UserModel): boolean { return ContactModel.canDeleteLabResult(user); }
  canRestoreLabResult(user: UserModel): boolean { return ContactModel.canRestoreLabResult(user); }
  canImportLabResult(user: UserModel): boolean { return ContactModel.canImportLabResult(user); }
  canExportLabResult(user: UserModel): boolean { return ContactModel.canExportLabResult(user); }

  /**
     * Permissions - IPermissionRelatedContactOfContact
     */
  canCreateContactOfContact(user: UserModel): boolean { return ContactModel.canCreateContactOfContact(user); }

  /**
   * Contact Name
   */
  get name(): string {
    const firstName = this.firstName ? this.firstName : '';
    const lastName = this.lastName ? this.lastName : '';
    const middleName = this.middleName ? this.middleName : '';
    return _.trim(`${firstName} ${middleName} ${lastName}`);
  }

  /**
   * Get the main Address
   */
  get mainAddress(): AddressModel {
    // get main address
    let mainAddress = _.find(this.addresses, { 'typeId': AddressType.CURRENT_ADDRESS });

    // do we have main address?
    // otherwise, use any address
    mainAddress = mainAddress ?
      mainAddress :
      (
        this.addresses?.length > 0 ?
          this.addresses[0] :
          undefined
      );

    // finished
    return mainAddress ?
      mainAddress :
      new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS
      });
  }
  set mainAddress(mainAddress: AddressModel) {
    // find address
    const existingAddressIndex = _.findIndex(this.addresses, { 'typeId': AddressType.CURRENT_ADDRESS });
    if (existingAddressIndex < 0) {
      // initialize
      if (!this.addresses) {
        this.addresses = [];
      }

      // put main address at the top
      this.addresses.splice(0, 0, mainAddress);
    } else if (mainAddress !== this.addresses[existingAddressIndex]) {
      // replace address
      this.addresses.splice(existingAddressIndex, 1, mainAddress);
    }
  }

  /**
   * Get phone numbers
   */
  get phoneNumbers(): string[] {
    return this.addresses.reduce((acc: string[], address) => {
      if (!_.isEmpty(address.phoneNumber)) {
        acc.push(address.phoneNumber);
      }
      return acc;
    }, []);
  }
}
