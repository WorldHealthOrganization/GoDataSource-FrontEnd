import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { moment } from '../helperClasses/x-moment';
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
    IPermissionRestorable
} from './permission.interface';

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
        IPermissionContact,
        IPermissionRelatedLabResult {
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
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;
    dateBecomeContact: string;
    wasCase: boolean;
    visualId: string;

    numberOfExposures: number;

    dob: string;
    age: AgeModel;

    vaccinesReceived: VaccineModel[];
    pregnancyStatus: string;

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    /**
     * Return contact id mask with data replaced
     * @param contactOfContactIdMask
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
    static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW, PERMISSION.CONTACT_MODIFY) : false); }
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
    static canBulkDelete(user: UserModel): boolean { return false; }
    static canBulkRestore(user: UserModel): boolean { return false; }

    /**
     * Static Permissions - IPermissionRestorable
     */
    static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_RESTORE) : false); }

    /**
     * Static Permissions - IPermissionRelatedRelationship
     */
    static canListRelationshipContacts(user: UserModel): boolean { return false; }
    static canViewRelationshipContacts(user: UserModel): boolean { return false; }
    static canCreateRelationshipContacts(user: UserModel): boolean { return false; }
    static canModifyRelationshipContacts(user: UserModel): boolean { return false; }
    static canDeleteRelationshipContacts(user: UserModel): boolean { return false; }
    static canListRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_LIST_RELATIONSHIP_EXPOSURES) : false); }
    static canViewRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_RELATIONSHIP_EXPOSURES) : false); }
    static canCreateRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CREATE_RELATIONSHIP_EXPOSURES) : false); }
    static canModifyRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_MODIFY_RELATIONSHIP_EXPOSURES) : false); }
    static canDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_DELETE_RELATIONSHIP_EXPOSURES) : false); }
    static canReverseRelationship(user: UserModel): boolean { return false; }
    static canListPersonsWithoutRelationships(user: UserModel): boolean { return false; }
    static canExportRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_RELATIONSHIPS) : false); }
    static canShareRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_SHARE_RELATIONSHIPS) : false); }
    static canChangeSource(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CHANGE_SOURCE_RELATIONSHIP) : false); }
    static canBulkDeleteRelationshipContacts(user: UserModel): boolean { return false; }
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
     * Static Permissions - IPermissionContact
     */
    static canGenerateVisualId(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_GENERATE_VISUAL_ID) : false); }
    static canConvertToCase(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CONVERT_TO_CASE) : false); }
    static canExportDailyFollowUpList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_DAILY_FOLLOW_UP_LIST) : false); }
    static canExportDailyFollowUpsForm(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_DAILY_FOLLOW_UP_FORM) : false); }
    static canExportDossier(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_EXPORT_DOSSIER) : false); }

    /**
     * Static Permissions - IPermissionRelatedLabResult
     */
    static canViewLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_VIEW_LAB_RESULT) : false); }
    static canListLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_LIST_LAB_RESULT) : false); }
    static canCreateLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CREATE_LAB_RESULT) : false); }
    static canModifyLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_MODIFY_LAB_RESULT) : false); }
    static canDeleteLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_DELETE_LAB_RESULT) : false); }
    static canRestoreLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_RESTORE_LAB_RESULT) : false); }
    static canImportLabResult(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_IMPORT_LAB_RESULT) : false); }
    static canExportLabResult(user: UserModel): boolean { return false; }
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
        this.wasCase = _.get(data, 'wasCase', false);

        this.dob = _.get(data, 'dob');
        this.age = new AgeModel(_.get(data, 'age'));

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
            }
        );

        this.numberOfExposures = _.get(data, 'numberOfExposures');

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
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.visualId = _.get(data, 'visualId', '');

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
    canCreateRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canCreateRelationshipContacts(user); }
    canModifyRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canModifyRelationshipContacts(user); }
    canDeleteRelationshipContacts(user: UserModel): boolean { return ContactOfContactModel.canDeleteRelationshipContacts(user); }
    canListRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canListRelationshipExposures(user); }
    canViewRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canViewRelationshipExposures(user); }
    canCreateRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canCreateRelationshipExposures(user); }
    canModifyRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canModifyRelationshipExposures(user); }
    canDeleteRelationshipExposures(user: UserModel): boolean { return ContactOfContactModel.canDeleteRelationshipExposures(user); }
    canReverseRelationship(user: UserModel): boolean { return ContactOfContactModel.canReverseRelationship(user); }
    canListPersonsWithoutRelationships(user: UserModel): boolean { return ContactOfContactModel.canListPersonsWithoutRelationships(user); }
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
     * Permissions - IPermissionContact
     */
    canGenerateVisualId(user: UserModel): boolean { return ContactOfContactModel.canGenerateVisualId(user); }
    canConvertToCase(user: UserModel): boolean { return ContactOfContactModel.canConvertToCase(user); }
    canExportDailyFollowUpList(user: UserModel): boolean { return ContactOfContactModel.canExportDailyFollowUpList(user); }
    canExportDailyFollowUpsForm(user: UserModel): boolean { return ContactOfContactModel.canExportDailyFollowUpsForm(user); }
    canExportDossier(user: UserModel): boolean { return ContactOfContactModel.canExportDossier(user); }

    /**
     * Permissions - IPermissionRelatedLabResult
     */
    canViewLabResult(user: UserModel): boolean { return ContactOfContactModel.canViewLabResult(user); }
    canListLabResult(user: UserModel): boolean { return ContactOfContactModel.canListLabResult(user); }
    canCreateLabResult(user: UserModel): boolean { return ContactOfContactModel.canCreateLabResult(user); }
    canModifyLabResult(user: UserModel): boolean { return ContactOfContactModel.canModifyLabResult(user); }
    canDeleteLabResult(user: UserModel): boolean { return ContactOfContactModel.canDeleteLabResult(user); }
    canRestoreLabResult(user: UserModel): boolean { return ContactOfContactModel.canRestoreLabResult(user); }
    canImportLabResult(user: UserModel): boolean { return ContactOfContactModel.canImportLabResult(user); }
    canExportLabResult(user: UserModel): boolean { return ContactOfContactModel.canExportLabResult(user); }
    /**
     * Contact Of Contact Name
     * @returns {string}
     */
    get name(): string {
        const firstName = this.firstName ? this.firstName : '';
        const lastName = this.lastName ? this.lastName : '';
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
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
