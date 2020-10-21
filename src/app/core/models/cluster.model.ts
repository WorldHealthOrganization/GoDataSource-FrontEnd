import * as _ from 'lodash';
import { IPermissionBasic, IPermissionCluster } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { environment } from '../../../environments/environment';

export class ClusterModel
    implements
        IPermissionBasic,
        IPermissionCluster {

    id: string;
    name: string;
    description: string;
    colorCode: string;

    private _iconId: string;
    iconUrl: string;
    set iconId(iconId: string) {
        this._iconId = iconId;
        this.iconUrl = _.isEmpty(this.iconId) ?
            undefined :
            `${environment.apiUrl}/icons/${this.iconId}/download`;
    }
    get iconId(): string {
        return this._iconId;
    }

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_VIEW, PERMISSION.CLUSTER_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_DELETE) : false; }

    /**
     * Static Permissions - IPermissionCluster
     */
    static canListPeople(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLUSTER_LIST_PEOPLE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.colorCode = _.get(data, 'colorCode');
        this.iconId = _.get(data, 'iconId');
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return ClusterModel.canView(user); }
    canList(user: UserModel): boolean { return ClusterModel.canList(user); }
    canCreate(user: UserModel): boolean { return ClusterModel.canCreate(user); }
    canModify(user: UserModel): boolean { return ClusterModel.canModify(user); }
    canDelete(user: UserModel): boolean { return ClusterModel.canDelete(user); }

    /**
     * Permissions - IPermissionCluster
     */
    canListPeople(user: UserModel): boolean { return ClusterModel.canListPeople(user); }
}
