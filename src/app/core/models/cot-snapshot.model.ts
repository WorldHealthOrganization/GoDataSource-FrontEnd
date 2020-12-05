import * as _ from 'lodash';
import { Moment, moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { IPermissionBasic } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';

export class CotSnapshotModel
    extends BaseModel
    implements
        IPermissionBasic {
    id: string;
    outbreakId: string;
    status: string;
    error: string;
    startDate: Moment;
    endDate: Moment;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }
    static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.COT_LIST) : false); }

    /**
     * Constructor
     */
    constructor(data = null) {
        // base model
        super(data);

        // base data
        this.id = _.get(data, 'id');
        this.outbreakId = _.get(data, 'outbreakId');
        this.status = _.get(data, 'status');
        this.error = _.get(data, 'error');

        // start date
        this.startDate = _.get(data, 'startDate');
        if (this.startDate) {
            this.startDate = moment(this.startDate);
        }

        // end date
        this.endDate = _.get(data, 'endDate');
        if (this.endDate) {
            this.endDate = moment(this.endDate);
        }
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return CotSnapshotModel.canView(user); }
    canList(user: UserModel): boolean { return CotSnapshotModel.canList(user); }
    canCreate(user: UserModel): boolean { return CotSnapshotModel.canCreate(user); }
    canModify(user: UserModel): boolean { return CotSnapshotModel.canModify(user); }
    canDelete(user: UserModel): boolean { return CotSnapshotModel.canDelete(user); }
}
