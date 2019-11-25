import { UserModel } from './user.model';

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

export interface IPermissionRestorable {
    /**
     * Has restore permission ?
     */
    canRestore(user: UserModel): boolean;
}

export interface IPermissionExportable {
    /**
     * Has export permission ?
     */
    canExport(user: UserModel): boolean;
}

export interface IPermissionRelatedContact {
    /**
     * Has permission that allows user to create a related contact ?
     */
    canCreateContact(user: UserModel): boolean;
}

export interface IPermissionRelatedContactBulk {
    /**
     * Has permission that allows user to create multiple contacts at the same time ?
     */
    canBulkCreateContact(user: UserModel): boolean;
}

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
