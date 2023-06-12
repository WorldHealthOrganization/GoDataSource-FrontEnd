import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { CaseCenterDateRangeModel } from './case-center-date-range.model';
import { IAnswerData, QuestionModel } from './question.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { Moment, moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { VaccineModel } from './vaccine.model';
import {
  IPermissionBasic,
  IPermissionBasicBulk,
  IPermissionCase,
  IPermissionChronology,
  IPermissionExportable,
  IPermissionImportable,
  IPermissionMovement,
  IPermissionRelatedContact,
  IPermissionRelatedContactBulk,
  IPermissionRelatedLabResult,
  IPermissionRelatedRelationship,
  IPermissionRestorable
} from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import {
  V2AdvancedFilter,
  V2AdvancedFilterType
} from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IResolverV2ResponseModel } from '../services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { LocationModel } from './location.model';
import {
  IV2ColumnStatusFormType,
  V2ColumnStatusForm
} from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { ReferenceDataEntryModel } from './reference-data.model';
import { SafeHtml } from '@angular/platform-browser';
import { I18nService } from '../services/helper/i18n.service';

export class CaseModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionRelatedRelationship,
    IPermissionRestorable,
    IPermissionBasicBulk,
    IPermissionImportable,
    IPermissionExportable,
    IPermissionRelatedContact,
    IPermissionRelatedContactBulk,
    IPermissionMovement,
    IPermissionChronology,
    IPermissionCase,
    IPermissionRelatedLabResult {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  occupation: string;
  riskLevel: string;
  riskReason: string;
  documents: DocumentModel[];
  addresses: AddressModel[];
  burialPlaceName: string;
  burialLocationId: string;
  burialLocation: LocationModel;
  classification: string;
  dateOfInfection: string | Moment;
  dateOfOnset: string | Moment;
  isDateOfOnsetApproximate: boolean;
  dateOfOutcome: string | Moment;
  safeBurial: boolean;
  dateOfBurial: string | Moment;
  dateRanges: CaseCenterDateRangeModel[];
  questionnaireAnswers: {
    [variable: string]: IAnswerData[];
  };

  questionnaireAnswersContact: {
    [variable: string]: IAnswerData[];
  };
  type: EntityType = EntityType.CASE;
  dateOfReporting: string | Moment;
  dateOfLastContact: string;
  isDateOfReportingApproximate: boolean;
  transferRefused: boolean;
  deathLocationId: string;
  deathLocation: LocationModel;
  outbreakId: string;
  investigationStatus: string;
  dateInvestigationCompleted: string | Moment;
  outcomeId: string;
  wasCase: boolean;
  dateBecomeCase: string | Moment;
  wasContact: boolean;
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

  responsibleUserId: string;
  responsibleUser: UserModel;

  visualId: string;

  relationships: {
    people: any[]
  }[];

  dob: string | Moment;
  age: AgeModel;

  inconsistencies: InconsistencyModel[];

  classificationHistory: {
    classification: string,
    startDate: string,
    endDate: string
  }[];

  vaccinesReceived: VaccineModel[];
  pregnancyStatus: string;

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
    caseInvestigationTemplate: () => QuestionModel[],
    options: {
      gender: ILabelValuePairModel[],
      occupation: ILabelValuePairModel[],
      risk: ILabelValuePairModel[],
      classification: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      outcome: ILabelValuePairModel[],
      clusterLoad: (finished: (data: IResolverV2ResponseModel<any>) => void) => void,
      pregnancy: ILabelValuePairModel[],
      vaccine: ILabelValuePairModel[],
      vaccineStatus: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      investigationStatus: ILabelValuePairModel[],
      documentType: ILabelValuePairModel[],
      addressType: ILabelValuePairModel[],
      dateRangeType: ILabelValuePairModel[],
      dateRangeCenter: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // Case
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_CASE_FIELD_LABEL_GENDER',
        options: data.options.gender,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CASE_FIELD_LABEL_AGE'
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CASE_FIELD_LABEL_DOB',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
        options: data.options.occupation
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
        options: data.options.risk
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'riskReason',
        label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'classification',
        label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        options: data.options.classification
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfInfection',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfOutcome',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateBecomeCase',
        label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'safeBurial',
        label: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfOnsetApproximate',
        label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'transferRefused',
        label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'investigationStatus',
        label: 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
        options: data.options.investigationStatus
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateInvestigationCompleted',
        label: 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'outcomeId',
        label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
        options: data.options.outcome
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContactOfContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'clusterId',
        label: 'LNG_CASE_FIELD_LABEL_CLUSTER_NAME',
        relationshipPath: ['relationships'],
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER',
        optionsLoad: data.options.clusterLoad
      }, {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: data.caseInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
        options: data.options.pregnancy,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE',
        options: data.options.vaccine
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE_STATUS',
        options: data.options.vaccineStatus
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CASE_FIELD_LABEL_VACCINE_DATE'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'documents.type',
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
        options: data.options.documentType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'documents.number',
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.emailAddress',
        label: 'LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'addresses.typeId',
        label: 'LNG_ADDRESS_FIELD_LABEL_TYPE',
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'addresses.date',
        label: 'LNG_ADDRESS_FIELD_LABEL_DATE',
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'deathLocationId',
        label: 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfBurial',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'burialLocationId',
        label: 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'burialPlaceName',
        label: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'dateRanges.typeId',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_TYPE_ID',
        options: data.options.dateRangeType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateRanges.startDate',
        label: 'LNG_FORM_RANGE_FIELD_LABEL_FROM',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateRanges.endDate',
        label: 'LNG_FORM_RANGE_FIELD_LABEL_TO',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'dateRanges.centerName',
        label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME',
        options: data.options.dateRangeCenter,
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        // parentLocationIdFilter is appended by the component
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'dateRanges',
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_LOCATION',
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'dateRanges.comments',
        label: 'LNG_CASE_FIELD_LABEL_CENTER_DATES_COMMENTS',
        sortable: true,
        relationshipLabel: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS'
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      }
    ];

    // allowed to filter by responsible user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user
      });
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
      item: CaseModel,
      i18nService: I18nService,
      classification: IResolverV2ResponseModel<ReferenceDataEntryModel>,
      outcome: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // classification
    if (
      info.item.classification &&
      info.classification.map[info.item.classification]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.CIRCLE,
        color: info.classification.map[info.item.classification].getColorCode(),
        tooltip: info.i18nService.instant(info.item.classification)
      });
    }

    // outcome
    if (
      info.item.outcomeId &&
      info.outcome.map[info.item.outcomeId]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.TRIANGLE,
        color: info.outcome.map[info.item.outcomeId].getColorCode(),
        tooltip: info.i18nService.instant(info.item.outcomeId)
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
   * Return case id mask with data replaced
   */
  static generateCaseIDMask(caseIdMask: string): string {
    // validate
    if (_.isEmpty(caseIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return caseIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW, PERMISSION.CASE_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_DELETE) : false); }

  /**
     * Static Permissions - IPermissionRelatedRelationship
     */
  static canListRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_RELATIONSHIP_CONTACTS) : false); }
  static canViewRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW_RELATIONSHIP_CONTACTS) : false); }
  static canCreateRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE_RELATIONSHIP_CONTACTS) : false); }
  static canModifyRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_MODIFY_RELATIONSHIP_CONTACTS) : false); }
  static canDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canListRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_RELATIONSHIP_EXPOSURES) : false); }
  static canViewRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW_RELATIONSHIP_EXPOSURES) : false); }
  static canCreateRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE_RELATIONSHIP_EXPOSURES) : false); }
  static canModifyRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_MODIFY_RELATIONSHIP_EXPOSURES) : false); }
  static canDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_DELETE_RELATIONSHIP_EXPOSURES) : false); }
  static canReverseRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_REVERSE_RELATIONSHIP) : false); }
  static canListPersonsWithoutRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_WITHOUT_RELATIONSHIPS) : false); }
  static canExportRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_RELATIONSHIPS) : false); }
  static canShareRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_SHARE_RELATIONSHIPS) : false); }
  static canChangeSource(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP) : false); }
  static canBulkDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_BULK_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canBulkDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_BULK_DELETE_RELATIONSHIP_EXPOSURES) : false); }

  /**
     * Static Permissions - IPermissionRestorable
     */
  static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_RESTORE) : false); }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(): boolean { return false; }
  static canBulkModify(): boolean { return false; }
  static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_BULK_DELETE) : false); }
  static canBulkRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_BULK_RESTORE) : false); }

  /**
     * Static Permissions - IPermissionImportable
     */
  static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_IMPORT) : false); }

  /**
     * Static Permissions - IPermissionExportable
     */
  static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT) : false); }

  /**
     * Static Permissions - IPermissionRelatedContact
     */
  static canCreateContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE_CONTACT) : false); }

  /**
     * Static Permissions - IPermissionRelatedContactBulk
     */
  static canBulkCreateContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE_BULK_CONTACT) : false); }

  /**
     * Static Permissions - IPermissionMovement
     */
  static canViewMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW_MOVEMENT_MAP) : false); }
  static canExportMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_MOVEMENT_MAP) : false); }

  /**
     * Static Permissions - IPermissionChronology
     */
  static canViewChronologyChart(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW_CHRONOLOGY_CHART) : false); }

  /**
     * Static Permissions - IPermissionCase
     */
  static canGenerateVisualId(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_GENERATE_VISUAL_ID) : false); }
  static canConvertToContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CONVERT_TO_CONTACT) : false); }
  static canExportInvestigationForm(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_INVESTIGATION_FORM) : false); }
  static canExportEmptyInvestigationForms(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_EMPTY_INVESTIGATION_FORMS) : false); }
  static canGroupByClassification(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_GROUP_BY_CLASSIFICATION) : false); }
  static canListOnsetBeforePrimaryReport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_ONSET_BEFORE_PRIMARY_CASE_REPORT) : false); }
  static canListLongPeriodBetweenOnsetDatesReport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_LONG_PERIOD_BETWEEN_DATES_REPORT) : false); }
  static canExportDossier(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_DOSSIER) : false); }
  static canListIsolatedCases(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_ISOLATED_CASES) : false); }

  /**
     * Static Permissions - IPermissionRelatedLabResult
     */
  static canViewLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_VIEW_LAB_RESULT) : false); }
  static canListLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LIST_LAB_RESULT) : false); }
  static canCreateLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_CREATE_LAB_RESULT) : false); }
  static canModifyLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_MODIFY_LAB_RESULT) : false); }
  static canDeleteLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_DELETE_LAB_RESULT) : false); }
  static canRestoreLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_RESTORE_LAB_RESULT) : false); }
  static canImportLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_IMPORT_LAB_RESULT) : false); }
  static canExportLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_EXPORT_LAB_RESULT) : false); }

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
    this.burialPlaceName = _.get(data, 'burialPlaceName');
    this.burialLocationId = _.get(data, 'burialLocationId');
    this.documents = _.get(data, 'documents', []);

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

    this.dob = _.get(data, 'dob');
    this.age = new AgeModel(_.get(data, 'age'));

    this.classification = _.get(data, 'classification');
    this.visualId = _.get(data, 'visualId');
    this.riskLevel = _.get(data, 'riskLevel');
    this.riskReason = _.get(data, 'riskReason');
    this.dateOfInfection = _.get(data, 'dateOfInfection');
    this.dateOfOnset = _.get(data, 'dateOfOnset');
    this.dateOfOutcome = _.get(data, 'dateOfOutcome');
    this.dateOfBurial = _.get(data, 'dateOfBurial');
    this.safeBurial = _.get(data, 'safeBurial');
    this.isDateOfOnsetApproximate = _.get(data, 'isDateOfOnsetApproximate');

    // date ranges locations
    const dateRangeLocations = _.get(data, 'dateRangeLocations');
    this.dateRanges = _.get(data, 'dateRanges', [])
      .map((dateRangeData) => {
        return new CaseCenterDateRangeModel(dateRangeData, dateRangeLocations);
      });
    // vaccines received
    const vaccinesReceived = _.get(data, 'vaccinesReceived');
    this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
      return new VaccineModel(vaccineData);
    });
    this.pregnancyStatus = _.get(data, 'pregnancyStatus');
    this.dateOfReporting = _.get(data, 'dateOfReporting');
    this.dateOfLastContact = _.get(data, 'dateOfLastContact');
    this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
    this.transferRefused = _.get(data, 'transferRefused');
    this.deathLocationId = _.get(data, 'deathLocationId');
    this.outbreakId = _.get(data, 'outbreakId');
    this.investigationStatus = _.get(data, 'investigationStatus');
    this.dateInvestigationCompleted = _.get(data, 'dateInvestigationCompleted');
    this.outcomeId = _.get(data, 'outcomeId');

    this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    this.questionnaireAnswersContact = _.get(data, 'questionnaireAnswersContact', {});

    this.relationships = _.get(data, 'relationships', []);
    this.wasCase = _.get(data, 'wasCase');
    this.dateBecomeCase = _.get(data, 'dateBecomeCase');
    this.wasContact = _.get(data, 'wasContact');
    this.dateBecomeContact = _.get(data, 'dateBecomeContact');
    this.wasContactOfContact = _.get(data, 'wasContactOfContact');
    this.dateBecomeContactOfContact = _.get(data, 'dateBecomeContactOfContact');

    this.numberOfContacts = _.get(data, 'numberOfContacts');
    this.numberOfExposures = _.get(data, 'numberOfExposures');

    this.inconsistencies = _.get(data, 'inconsistencies', []);
    _.each(this.inconsistencies, (inconsistency, index) => {
      this.inconsistencies[index] = new InconsistencyModel(inconsistency);
    });

    this.classificationHistory = _.get(data, 'classificationHistory', []);
    this.relationship = _.get(data, 'relationship');

    this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
    _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
      this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
    });

    this.followUp = _.get(data, 'followUp', {});

    this.responsibleUserId = _.get(data, 'responsibleUserId');
    this.responsibleUser = _.get(data, 'responsibleUser');
    if (this.responsibleUser) {
      this.responsibleUser = new UserModel(this.responsibleUser);
    }
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return CaseModel.canView(user); }
  canList(user: UserModel): boolean { return CaseModel.canList(user); }
  canCreate(user: UserModel): boolean { return CaseModel.canCreate(user); }
  canModify(user: UserModel): boolean { return CaseModel.canModify(user); }
  canDelete(user: UserModel): boolean { return CaseModel.canDelete(user); }

  /**
     * Permissions - IPermissionRelatedRelationship
     */
  canListRelationshipContacts(user: UserModel): boolean { return CaseModel.canListRelationshipContacts(user); }
  canViewRelationshipContacts(user: UserModel): boolean { return CaseModel.canViewRelationshipContacts(user); }
  canCreateRelationshipContacts(user: UserModel): boolean { return CaseModel.canCreateRelationshipContacts(user); }
  canModifyRelationshipContacts(user: UserModel): boolean { return CaseModel.canModifyRelationshipContacts(user); }
  canDeleteRelationshipContacts(user: UserModel): boolean { return CaseModel.canDeleteRelationshipContacts(user); }
  canListRelationshipExposures(user: UserModel): boolean { return CaseModel.canListRelationshipExposures(user); }
  canViewRelationshipExposures(user: UserModel): boolean { return CaseModel.canViewRelationshipExposures(user); }
  canCreateRelationshipExposures(user: UserModel): boolean { return CaseModel.canCreateRelationshipExposures(user); }
  canModifyRelationshipExposures(user: UserModel): boolean { return CaseModel.canModifyRelationshipExposures(user); }
  canDeleteRelationshipExposures(user: UserModel): boolean { return CaseModel.canDeleteRelationshipExposures(user); }
  canReverseRelationship(user: UserModel): boolean { return CaseModel.canReverseRelationship(user); }
  canListPersonsWithoutRelationships(user: UserModel): boolean { return CaseModel.canListPersonsWithoutRelationships(user); }
  canExportRelationships(user: UserModel): boolean { return CaseModel.canExportRelationships(user); }
  canShareRelationship(user: UserModel): boolean { return CaseModel.canShareRelationship(user); }
  canChangeSource(user: UserModel): boolean { return CaseModel.canChangeSource(user); }
  canBulkDeleteRelationshipContacts(user: UserModel): boolean { return CaseModel.canBulkDeleteRelationshipContacts(user); }
  canBulkDeleteRelationshipExposures(user: UserModel): boolean { return CaseModel.canBulkDeleteRelationshipExposures(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return CaseModel.canRestore(user); }

  /**
   * Permissions - IPermissionBasicBulk
   */
  canBulkCreate(): boolean { return CaseModel.canBulkCreate(); }
  canBulkModify(): boolean { return CaseModel.canBulkModify(); }
  canBulkDelete(user: UserModel): boolean { return CaseModel.canBulkDelete(user); }
  canBulkRestore(user: UserModel): boolean { return CaseModel.canBulkRestore(user); }

  /**
     * Permissions - IPermissionImportable
     */
  canImport(user: UserModel): boolean { return CaseModel.canImport(user); }

  /**
     * Permissions - IPermissionExportable
     */
  canExport(user: UserModel): boolean { return CaseModel.canExport(user); }

  /**
     * Permissions - IPermissionRelatedContact
     */
  canCreateContact(user: UserModel): boolean { return CaseModel.canCreateContact(user); }

  /**
     * Permissions - IPermissionRelatedContactBulk
     */
  canBulkCreateContact(user: UserModel): boolean { return CaseModel.canBulkCreateContact(user); }

  /**
     * Permissions - IPermissionMovement
     */
  canViewMovementMap(user: UserModel): boolean { return CaseModel.canViewMovementMap(user); }
  canExportMovementMap(user: UserModel): boolean { return CaseModel.canExportMovementMap(user); }

  /**
     * Permissions - IPermissionChronology
     */
  canViewChronologyChart(user: UserModel): boolean { return CaseModel.canViewChronologyChart(user); }

  /**
     * Permissions - IPermissionCase
     */
  canGenerateVisualId(user: UserModel): boolean { return CaseModel.canGenerateVisualId(user); }
  canConvertToContact(user: UserModel): boolean { return CaseModel.canConvertToContact(user); }
  canExportInvestigationForm(user: UserModel): boolean { return CaseModel.canExportInvestigationForm(user); }
  canExportEmptyInvestigationForms(user: UserModel): boolean { return CaseModel.canExportEmptyInvestigationForms(user); }
  canGroupByClassification(user: UserModel): boolean { return CaseModel.canGroupByClassification(user); }
  canListOnsetBeforePrimaryReport(user: UserModel): boolean { return CaseModel.canListOnsetBeforePrimaryReport(user); }
  canListLongPeriodBetweenOnsetDatesReport(user: UserModel): boolean { return CaseModel.canListLongPeriodBetweenOnsetDatesReport(user); }
  canExportDossier(user: UserModel): boolean { return CaseModel.canExportDossier(user); }
  canListIsolatedCases(user: UserModel): boolean { return CaseModel.canListIsolatedCases(user); }

  /**
     * Permissions - IPermissionRelatedLabResult
     */
  canViewLabResult(user: UserModel): boolean { return CaseModel.canViewLabResult(user); }
  canListLabResult(user: UserModel): boolean { return CaseModel.canListLabResult(user); }
  canCreateLabResult(user: UserModel): boolean { return CaseModel.canCreateLabResult(user); }
  canModifyLabResult(user: UserModel): boolean { return CaseModel.canModifyLabResult(user); }
  canDeleteLabResult(user: UserModel): boolean { return CaseModel.canDeleteLabResult(user); }
  canRestoreLabResult(user: UserModel): boolean { return CaseModel.canRestoreLabResult(user); }
  canImportLabResult(user: UserModel): boolean { return CaseModel.canImportLabResult(user); }
  canExportLabResult(user: UserModel): boolean { return CaseModel.canExportLabResult(user); }

  /**
     * Case Name
     * @returns {string}
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
