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
  IPermissionContactOfContacts,
  IPermissionExportable,
  IPermissionImportable,
  IPermissionMovement,
  IPermissionRelatedRelationship,
  IPermissionRestorable
} from './permission.interface';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { SafeHtml } from '@angular/platform-browser';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { IResolverV2ResponseModel } from '../services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from './reference-data.model';
import { I18nService } from '../services/helper/i18n.service';
import { IAnswerData } from './question.model';

export interface IContactOfContactIsolated {
  id: string,
  firstName: string,
  middleName: string,
  lastName: string
}

export class ContactOfContactModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionExportable,
    IPermissionImportable,
    IPermissionBasicBulk,
    IPermissionRestorable,
    IPermissionRelatedRelationship,
    IPermissionMovement,
    IPermissionChronology,
    IPermissionContactOfContacts {
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
  type: EntityType = EntityType.CONTACT_OF_CONTACT;
  dateOfReporting: string | Moment;
  dateOfLastContact: string;
  isDateOfReportingApproximate: boolean;
  outbreakId: string;
  visualId: string;
  wasCase: boolean;
  dateBecomeCase: string | Moment;
  wasContact: boolean;
  dateBecomeContact: string | Moment;
  wasContactOfContact: boolean;
  dateBecomeContactOfContact: string | Moment;

  questionnaireAnswersCase: {
    [variable: string]: IAnswerData[];
  };
  questionnaireAnswersContact: {
    [variable: string]: IAnswerData[];
  };

  numberOfContacts: number;
  numberOfExposures: number;

  // this property was added to handle the legacy follow-ups (if the contact of a contact was a contact)
  followUp: {
    originalStartDate: string,
    startDate: string,
    endDate: string,
    status: string
  };

  dob: string | Moment;
  age: AgeModel;

  vaccinesReceived: VaccineModel[];
  pregnancyStatus: string;

  inconsistencies: InconsistencyModel[];
  relationship: any;

  matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

  responsibleUserId: string;
  responsibleUser: UserModel;

  // used by ui
  uiStatusForms: SafeHtml;
  uiDocuments: string;
  uiVaccines: string;

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    authUser: UserModel,
    options: {
      occupation: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      gender: ILabelValuePairModel[],
      pregnancy: ILabelValuePairModel[],
      documentType: ILabelValuePairModel[],
      addressType: ILabelValuePairModel[],
      risk: ILabelValuePairModel[],
      vaccine: ILabelValuePairModel[],
      vaccineStatus: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      // Contact of contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
        options: data.options.occupation,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        isArray: true,
        sortable: 'addresses.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasCase',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
        options: data.options.gender,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        options: data.options.pregnancy,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'documents.type',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENT_TYPE',
        options: data.options.documentType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'documents.number',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENT_NUMBER',
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_EMAIL',
        sortable: true,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'addresses.typeId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_TYPE',
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'addresses.date',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_DATE',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.city',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_CITY',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'addresses.postalCode',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        sortable: true,
        relationshipLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES',
        useLike: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
        options: data.options.risk,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'riskReason',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE',
        options: data.options.vaccine,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        options: data.options.vaccineStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINE_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
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
      item: ContactOfContactModel,
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

    // finished
    return forms;
  }

  /**
   * Return contact id mask with data replaced
   */
  static generateContactOfContactIDMask(contactOfContactIdMask: string): string {
    // validate
    if (_.isEmpty(contactOfContactIdMask)) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return contactOfContactIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW, PERMISSION.CONTACT_OF_CONTACT_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_DELETE) : false); }

  /**
     * Static Permissions - IPermissionExportable
     */
  static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT) : false); }

  /**
     * Static Permissions - IPermissionImportable
     */
  static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_IMPORT) : false); }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_CREATE) : false); }
  static canBulkModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_MODIFY) : false); }
  static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_DELETE) : false); }
  static canBulkRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_RESTORE) : false); }

  /**
     * Static Permissions - IPermissionRestorable
     */
  static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_RESTORE) : false); }

  /**
     * Static Permissions - IPermissionRelatedRelationship
     */
  static canListRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_LIST_RELATIONSHIP_CONTACTS) : false); }
  static canViewRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_RELATIONSHIP_CONTACTS) : false); }
  static canCreateRelationshipContacts(): boolean { return false; }
  static canModifyRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_MODIFY_RELATIONSHIP_CONTACTS) : false); }
  static canDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canListRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_LIST_RELATIONSHIP_EXPOSURES) : false); }
  static canViewRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_RELATIONSHIP_EXPOSURES) : false); }
  static canCreateRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CREATE_RELATIONSHIP_EXPOSURES) : false); }
  static canModifyRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_MODIFY_RELATIONSHIP_EXPOSURES) : false); }
  static canDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_DELETE_RELATIONSHIP_EXPOSURES) : false); }
  static canReverseRelationship(): boolean { return false; }
  static canListPersonsWithoutRelationships(): boolean { return false; }
  static canExportRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_RELATIONSHIPS) : false); }
  static canShareRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_SHARE_RELATIONSHIPS) : false); }
  static canChangeSource(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CHANGE_SOURCE_RELATIONSHIP) : false); }
  static canBulkDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canBulkDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_BULK_DELETE_RELATIONSHIP_EXPOSURES) : false); }

  /**
     * Static Permissions - IPermissionMovement
     */
  static canViewMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_MOVEMENT_MAP) : false); }
  static canExportMovementMap(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_MOVEMENT_MAP) : false); }

  /**
     * Static Permissions - IPermissionChronology
     */
  static canViewChronologyChart(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_CHRONOLOGY_CHART) : false); }

  /**
     * Static Permissions - IPermissionContactOfContacts
     */
  static canGenerateVisualId(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_GENERATE_VISUAL_ID) : false); }
  static canExportDossier(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_DOSSIER) : false); }
  static canConvertToContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CONVERT_TO_CONTACT) : false); }

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

    this.followUp = _.get(data, 'followUp');

    // vaccines received
    const vaccinesReceived = _.get(data, 'vaccinesReceived');
    this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
      return new VaccineModel(vaccineData);
    });
    this.pregnancyStatus = _.get(data, 'pregnancyStatus');

    this.riskLevel = _.get(data, 'riskLevel');
    this.riskReason = _.get(data, 'riskReason');
    this.dateOfReporting = _.get(data, 'dateOfReporting');
    this.dateOfLastContact = _.get(data, 'dateOfLastContact');
    this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
    this.visualId = _.get(data, 'visualId', '');

    this.wasCase = _.get(data, 'wasCase');
    this.dateBecomeCase = _.get(data, 'dateBecomeCase');
    this.wasContact = _.get(data, 'wasContact');
    this.dateBecomeContact = _.get(data, 'dateBecomeContact');
    this.wasContactOfContact = _.get(data, 'wasContactOfContact');
    this.dateBecomeContactOfContact = _.get(data, 'dateBecomeContactOfContact');

    this.questionnaireAnswersCase = _.get(data, 'questionnaireAnswersCase', {});
    this.questionnaireAnswersContact = _.get(data, 'questionnaireAnswersContact', {});

    this.inconsistencies = _.get(data, 'inconsistencies', []);
    _.each(this.inconsistencies, (inconsistency, index) => {
      this.inconsistencies[index] = new InconsistencyModel(inconsistency);
    });

    this.relationship = _.get(data, 'relationship');

    this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
    _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
      this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
    });

    this.responsibleUserId = _.get(data, 'responsibleUserId');
    this.responsibleUser = _.get(data, 'responsibleUser');
    if (this.responsibleUser) {
      this.responsibleUser = new UserModel(this.responsibleUser);
    }
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return ContactOfContactModel.canView(user); }
  canList(user: UserModel): boolean { return ContactOfContactModel.canList(user); }
  canCreate(user: UserModel): boolean { return ContactOfContactModel.canCreate(user); }
  canModify(user: UserModel): boolean { return ContactOfContactModel.canModify(user); }
  canDelete(user: UserModel): boolean { return ContactOfContactModel.canDelete(user); }

  /**
     * Permissions - IPermissionExportable
     */
  canExport(user: UserModel): boolean { return ContactOfContactModel.canExport(user); }

  /**
     * Permissions - IPermissionImportable
     */
  canImport(user: UserModel): boolean { return ContactOfContactModel.canImport(user); }

  /**
     * Permissions - IPermissionBasicBulk
     */
  canBulkCreate(user: UserModel): boolean { return ContactOfContactModel.canBulkCreate(user); }
  canBulkModify(user: UserModel): boolean { return ContactOfContactModel.canBulkModify(user); }
  canBulkDelete(user: UserModel): boolean { return ContactOfContactModel.canBulkDelete(user); }
  canBulkRestore(user: UserModel): boolean { return ContactOfContactModel.canBulkRestore(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return ContactOfContactModel.canRestore(user); }

  /**
     * Permissions - IPermissionRelatedRelationship
     */
  canListRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canListRelationshipContacts(user); }
  canViewRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canViewRelationshipContacts(user); }
  canCreateRelationshipContacts(): boolean { return ContactOfContactModel.canCreateRelationshipContacts(); }
  canModifyRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canModifyRelationshipContacts(user); }
  canDeleteRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canDeleteRelationshipContacts(user); }
  canListRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canListRelationshipExposures(user); }
  canViewRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canViewRelationshipExposures(user); }
  canCreateRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canCreateRelationshipExposures(user); }
  canModifyRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canModifyRelationshipExposures(user); }
  canDeleteRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canDeleteRelationshipExposures(user); }
  canReverseRelationship(): boolean { return ContactOfContactModel.canReverseRelationship(); }
  canListPersonsWithoutRelationships(): boolean { return ContactOfContactModel.canListPersonsWithoutRelationships(); }
  canExportRelationships(user: UserModel): boolean { return ContactOfContactModel.canExportRelationships(user); }
  canShareRelationship(user: UserModel): boolean { return ContactOfContactModel.canShareRelationship(user); }
  canChangeSource(user: UserModel): boolean { return ContactOfContactModel.canChangeSource(user); }
  canBulkDeleteRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canBulkDeleteRelationshipContacts(user); }
  canBulkDeleteRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canBulkDeleteRelationshipExposures(user); }

  /**
     * Permissions - IPermissionMovement
     */
  canViewMovementMap(user: UserModel): boolean { return ContactOfContactModel.canViewMovementMap(user); }
  canExportMovementMap(user: UserModel): boolean { return ContactOfContactModel.canExportMovementMap(user); }

  /**
     * Permissions - IPermissionChronology
     */
  canViewChronologyChart(user: UserModel): boolean { return ContactOfContactModel.canViewChronologyChart(user); }

  /**
     * Permissions - IPermissionContactOfContacts
     */
  canGenerateVisualId(user: UserModel): boolean { return ContactOfContactModel.canGenerateVisualId(user); }
  canExportDossier(user: UserModel): boolean { return ContactOfContactModel.canExportDossier(user); }
  canConvertToContact(user: UserModel): boolean { return ContactOfContactModel.canConvertToContact(user); }

  /**
   * Contact Of Contact Name
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
