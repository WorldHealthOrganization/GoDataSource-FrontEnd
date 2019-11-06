import { UserModel } from './user.model';

export interface IPermissionModel {
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
}
