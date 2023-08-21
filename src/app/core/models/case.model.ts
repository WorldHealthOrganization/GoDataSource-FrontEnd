import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { CaseCenterDateRangeModel } from './case-center-date-range.model';
import { IAnswerData } from './question.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { Moment } from '../helperClasses/x-moment';
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
import { LocationModel } from './location.model';
import { SafeHtml } from '@angular/platform-browser';

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

  // this property was added to handle the legacy follow-ups (if the case was a contact)
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
  uiDocuments: string;
  uiVaccines: string;
  uiDateRanges: string;

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
}
