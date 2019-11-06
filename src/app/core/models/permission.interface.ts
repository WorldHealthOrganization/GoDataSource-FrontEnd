import { UserModel } from './user.model';

export interface IPermissionModel {
    // Model specific

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
     * Has bulk create permission ?
     */
    canBulkCreate?(user: UserModel): boolean;

    /**
     * Has modify permission ?
     */
    canModify(user: UserModel): boolean;

    /**
     * Has bulk modify permission ?
     */
    canBulkModify?(user: UserModel): boolean;

    /**
     * Has delete permission ?
     */
    canDelete(user: UserModel): boolean;

    /**
     * Has bulk delete permission ?
     */
    canBulkDelete?(user: UserModel): boolean;

    /**
     * Has restore permission ?
     */
    canRestore?(user: UserModel): boolean;

    /**
     * Has bulk restore permission ?
     */
    canBulkRestore?(user: UserModel): boolean;

    // END of Model specific



    // Related Models

    /**
     * Has permission that allows user to create a related contact ?
     */
    canCreateContact?(user: UserModel): boolean;

    /**
     * Has permission that allows user to create multiple contacts at the same time ?
     */
    canBulkCreateContact?(user: UserModel): boolean;

    // END of Related Models
}
