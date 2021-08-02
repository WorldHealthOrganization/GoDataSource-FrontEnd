import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { IPermissionBasic } from './permission.interface';
import { ExportStatusStep } from './constants';

export class ExportLogModel
    extends BaseModel
    implements
        IPermissionBasic {
    id: string;
    resourceType: string;
    status: string;
    statusStep: ExportStatusStep;
    totalNo: number;
    processedNo: number;
    actionStartDate: string;
    actionCompletionDate: string;
    extension: string;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return !!user; }
    static canList(user: UserModel): boolean { return !!user; }
    static canCreate(): boolean { return false; }
    static canModify(): boolean { return false; }
    static canDelete(): boolean { return false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        // import data
        this.id = _.get(data, 'id');
        this.resourceType = _.get(data, 'resourceType');
        this.status = _.get(data, 'status');
        this.statusStep = _.get(data, 'statusStep');
        this.totalNo = _.get(data, 'totalNo');
        this.processedNo = _.get(data, 'processedNo');
        this.actionStartDate = _.get(data, 'actionStartDate');
        this.actionCompletionDate = _.get(data, 'actionCompletionDate');
        this.extension = _.get(data, 'extension');
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return ExportLogModel.canView(user); }
    canList(user: UserModel): boolean { return ExportLogModel.canList(user); }
    canCreate(): boolean { return ExportLogModel.canCreate(); }
    canModify(): boolean { return ExportLogModel.canModify(); }
    canDelete(): boolean { return ExportLogModel.canDelete(); }
}
