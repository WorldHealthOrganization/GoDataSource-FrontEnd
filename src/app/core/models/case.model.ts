import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { CaseCenterDateRangeModel } from './case-center-date-range.model';
import { IAnswerData } from './question.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { VaccineModel } from './vaccine.model';
import {
    IPermissionBasic,
    IPermissionCase,
    IPermissionChronology,
    IPermissionExportable,
    IPermissionImportable,
    IPermissionMovement,
    IPermissionRelatedContact,
    IPermissionRelatedContactBulk,
    IPermissionRelatedRelationship,
    IPermissionRestorable
} from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';

export class CaseModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionRelatedRelationship,
        IPermissionRestorable,
        IPermissionImportable,
        IPermissionExportable,
        IPermissionRelatedContact,
        IPermissionRelatedContactBulk,
        IPermissionMovement,
        IPermissionChronology,
        IPermissionCase {
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
    classification: string;
    dateOfInfection: string;
    dateOfOnset: string;
    isDateOfOnsetApproximate: boolean;
    dateOfOutcome: string;
    dateBecomeCase: string;
    safeBurial: boolean;
    dateOfBurial: string;
    dateRanges: CaseCenterDateRangeModel[];
    questionnaireAnswers: {
        [variable: string]: IAnswerData[];
    };
    type: EntityType = EntityType.CASE;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    transferRefused: boolean;
    outbreakId: string;
    outcomeId: string;
    dateBecomeContact: string;
    wasContact: boolean;

    numberOfContacts: number;
    numberOfExposures: number;

    visualId: string;

    relationships: {
        people: any[]
    }[];

    dob: string;
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

    /**
     * Return case id mask with data replaced
     * @param caseIdMask
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

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
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
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
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
        this.outbreakId = _.get(data, 'outbreakId');
        this.outcomeId = _.get(data, 'outcomeId');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

        this.relationships = _.get(data, 'relationships', []);
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.wasContact = _.get(data, 'wasContact');

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
     * Case Name
     * @returns {string}
     */
    get name(): string {
        const firstName = this.firstName ? this.firstName : '';
        const lastName = this.lastName ? this.lastName : '';
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     * @returns {AddressModel}
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': AddressType.CURRENT_ADDRESS});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
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
