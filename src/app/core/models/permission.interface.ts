import { UserModel } from './user.model';

/**
 * Basic
 */
export interface IPermissionBasic {
    /**
     * Has view permission ?
     */
    canView(user: UserModel): boolean;

    /**
     * Has list permission ?
     */
    canList(user: UserModel): boolean;

    /**
     * Has create permission ?
     */
    canCreate(user: UserModel): boolean;

    /**
     * Has modify permission ?
     */
    canModify(user: UserModel): boolean;

    /**
     * Has delete permission ?
     */
    canDelete(user: UserModel): boolean;
}

/**
 * Basic Bulk
 */
export interface IPermissionBasicBulk {
    /**
     * Has bulk create permission ?
     */
    canBulkCreate(user: UserModel): boolean;

    /**
     * Has bulk modify permission ?
     */
    canBulkModify(user: UserModel): boolean;

    /**
     * Has bulk delete permission ?
     */
    canBulkDelete(user: UserModel): boolean;

    /**
     * Has bulk restore permission ?
     */
    canBulkRestore(user: UserModel): boolean;
}

/**
 * Restore
 */
export interface IPermissionRestorable {
    /**
     * Has restore permission ?
     */
    canRestore(user: UserModel): boolean;
}

/**
 * Export
 */
export interface IPermissionExportable {
    /**
     * Has export permission ?
     */
    canExport(user: UserModel): boolean;
}

/**
 * Clone
 */
export interface IPermissionCloneable {
    /**
     * Has permission to create a clone
     */
    canClone(user: UserModel): boolean;
}

/**
 * User
 */
export interface IPermissionUser {
    /**
     * Has permission to modify his account
     */
    canModifyOwnAccount(user: UserModel): boolean;
}

/**
 * Questionnaire
 */
export interface IPermissionQuestionnaire {
    /**
     * Has permission to modify case questionnaire
     */
    canModifyCaseQuestionnaire(user: UserModel): boolean;

    /**
     * Has permission to modify contact follow-up questionnaire
     */
    canModifyContactFollowUpQuestionnaire(user: UserModel): boolean;

    /**
     * Has permission to modify case lab result questionnaire
     */
    canModifyCaseLabResultQuestionnaire(user: UserModel): boolean;
}

/**
 * Outbreak
 */
export interface IPermissionOutbreak {
    /**
     * Has permission to make the selected outbreak active for the current user
     */
    canMakeOutbreakActive(user: UserModel): boolean;

    /**
     * Has permission to see inconsistencies in key dates
     */
    canSeeInconsistencies(user: UserModel): boolean;
}

/**
 * Outbreak Template
 */
export interface IPermissionOutbreakTemplate {
    /**
     * Has permission to generate an outbreak from an outbreak template
     */
    canGenerateOutbreak(user: UserModel): boolean;
}

/**
 * Contact
 */
export interface IPermissionRelatedContact {
    /**
     * Has permission that allows user to create a related contact ?
     */
    canCreateContact(user: UserModel): boolean;
}

/**
 * Contact Bulk
 */
export interface IPermissionRelatedContactBulk {
    /**
     * Has permission that allows user to create multiple contacts at the same time ?
     */
    canBulkCreateContact(user: UserModel): boolean;
}

/**
 * Relationship
 */
export interface IPermissionRelationship {
    /**
     * Can we reverse a relationship target & source ?
     */
    canReverse(user: UserModel): boolean;

    /**
     * Can we share relationships ?
     */
    canShare(user: UserModel): boolean;
}

/**
 * Case / Contact / Event - Relationship
 */
export interface IPermissionRelatedRelationship {
    /**
     * Can we list relationship contacts ?
     */
    canListRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we view relationship contacts ?
     */
    canViewRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we create relationship contacts ?
     */
    canCreateRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we modify relationship contacts ?
     */
    canModifyRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we delete relationship contacts ?
     */
    canDeleteRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we list relationship exposures ?
     */
    canListRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we view relationship exposures ?
     */
    canViewRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we create relationship exposures ?
     */
    canCreateRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we modify relationship exposures ?
     */
    canModifyRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we delete relationship exposures ?
     */
    canDeleteRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we reverse a relationship target & source ?
     */
    canReverseRelationship(user: UserModel): boolean;

    /**
     * Can see the list of persons ( events... ) without relationships
     */
    canListPersonsWithoutRelationships(user: UserModel): boolean;

    /**
     * Has relationship export permission ( events, cases, contacts...) ?
     */
    canExportRelationships(user: UserModel): boolean;

    /**
     * Can we share relationships from a person ( case, contact, event ) ?
     */
    canShareRelationship(user: UserModel): boolean;

    /**
     * Can we change source person of a relationship ?
     */
    canChangeSource(user: UserModel): boolean;

    /**
     * Can bulk delete relationships exposures from events / cases & contacts
     */
    canBulkDeleteRelationshipExposures(user: UserModel): boolean;

    /**
     * Can bulk delete relationships contacts from events / cases & contacts
     */
    canBulkDeleteRelationshipContacts(user: UserModel): boolean;
}
