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
    IPermissionBasicBulk, IPermissionRelatedContactBulk,
    IPermissionChronology,
    IPermissionContact,
    IPermissionExportable,
    IPermissionImportable,
    IPermissionMovement,
    IPermissionRelatedLabResult,
    IPermissionRelatedRelationship,
    IPermissionRestorable
} from './permission.interface';
import { IAnswerData } from './question.model';

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
        IPermissionBasicBulk, IPermissionRelatedContactBulk,
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
    type: EntityType = EntityType.CONTACT;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;
    dateBecomeContact: string;
    dateBecomeCase: string;
    wasCase: boolean;
    visualId: string;

    numberOfContacts: number;
    numberOfExposures: number;

    followUp: {
        originalStartDate: string,
        startDate: string,
        endDate: string,
        status: string
    };

    followUpHistory: IFollowUpHistory[];

    dob: string;
    age: AgeModel;

    vaccinesReceived: VaccineModel[];
    pregnancyStatus: string;

    questionnaireAnswers: {
        [variable: string]: IAnswerData[];
    };

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    /**
     * Return contact id mask with data replaced
     * @param contactIdMask
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
    static canBulkDelete(user: UserModel): boolean { return false; }
    static canBulkRestore(user: UserModel): boolean { return false; }

    /**
     * Static Permissions - IPermissionRelatedContactBulk
     */
    static canBulkCreateContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_BULK_CONTACT_OF_CONTACT) : false); }

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
    static canReverseRelationship(user: UserModel): boolean { return false; }
    static canListPersonsWithoutRelationships(user: UserModel): boolean { return false; }
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
     * Static Permissions - IPermissionsContactsOfContacts
     */
    static canCreateContactOfContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CONTACT_OF_CONTACT_CREATE) : false); }

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
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
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

        this.numberOfContacts = _.get(data, 'numberOfContacts');
        this.numberOfExposures = _.get(data, 'numberOfExposures');

        // vaccines received
        const vaccinesReceived = _.get(data, 'vaccinesReceived');
        this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
            return new VaccineModel(vaccineData);
        });
        this.pregnancyStatus = _.get(data, 'pregnancyStatus');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.dateOfLastContact = _.get(data, 'dateOfLastContact');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.visualId = _.get(data, 'visualId', '');

        this.followUp = _.get(data, 'followUp', {});
        this.followUpHistory = _.get(data, 'followUpHistory', []);

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
    canBulkDelete(user: UserModel): boolean { return ContactModel.canBulkDelete(user); }
    canBulkRestore(user: UserModel): boolean { return ContactModel.canBulkRestore(user); }

    /**
     * Permissions - IPermissionRelatedContactBulk
     */
    canBulkCreateContact(user: UserModel): boolean {return ContactModel.canBulkCreateContact(user); }

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
    canReverseRelationship(user: UserModel): boolean { return ContactModel.canReverseRelationship(user); }
    canListPersonsWithoutRelationships(user: UserModel): boolean { return ContactModel.canListPersonsWithoutRelationships(user); }
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
     * Contact Name
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
