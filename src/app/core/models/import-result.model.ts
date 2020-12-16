import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';

export class ImportResultModel
    extends BaseModel
    implements
        IPermissionBasic {

    // data
    recordNo: number;
    error: {
        code: string,
        message: string,
        statusCode: number,
        details: any
    };

    // json data
    data: {
        file: any,
        save: any
    };

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return !!user; }
    static canList(user: UserModel): boolean { return !!user; }
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        // import data
        this.recordNo = _.get(data, 'recordNo');
        this.error = _.get(data, 'error');
        this.data = _.get(data, 'data');
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return ImportResultModel.canView(user); }
    canList(user: UserModel): boolean { return ImportResultModel.canList(user); }
    canCreate(user: UserModel): boolean { return ImportResultModel.canCreate(user); }
    canModify(user: UserModel): boolean { return ImportResultModel.canModify(user); }
    canDelete(user: UserModel): boolean { return ImportResultModel.canDelete(user); }
}
