import * as _ from 'lodash';
import { IPermissionBasic } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class HelpCategoryModel
    implements
        IPermissionBasic {
    id: string;
    name: string;
    description: string;
    order: number;
    deleted: boolean;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_VIEW, PERMISSION.HELP_CATEGORY_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.HELP_CATEGORY_DELETE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.deleted = _.get(data, 'deleted', false);
        this.order = _.get(data, 'order', 1);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return HelpCategoryModel.canView(user); }
    canList(user: UserModel): boolean { return HelpCategoryModel.canList(user); }
    canCreate(user: UserModel): boolean { return HelpCategoryModel.canCreate(user); }
    canModify(user: UserModel): boolean { return HelpCategoryModel.canModify(user); }
    canDelete(user: UserModel): boolean { return HelpCategoryModel.canDelete(user); }
}
