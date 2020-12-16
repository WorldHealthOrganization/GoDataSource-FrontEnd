import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';
import { IPermissionBasic, IPermissionUpstreamServer } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class SystemUpstreamServerModel
    implements
        IPermissionBasic,
        IPermissionUpstreamServer {
    id: string;
    name: string;
    description: string;
    url: string;
    timeout: number;
    credentials: SystemUpstreamServerCredentialsModel;
    syncInterval: number;
    syncOnEveryChange: boolean;
    syncEnabled: boolean;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_CREATE) : false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_DELETE) : false; }

    /**
     * Static Permissions - IPermissionUpstreamServer
     */
    static canSync(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_SYNC) : false; }
    static canEnableSync(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_ENABLE_SYNC) : false; }
    static canDisableSync(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.UPSTREAM_SERVER_DISABLE_SYNC) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.url = _.get(data, 'url');
        this.timeout = _.get(data, 'timeout', 0);
        this.credentials = new SystemUpstreamServerCredentialsModel(_.get(data, 'credentials'));
        this.syncInterval = _.get(data, 'syncInterval', 0);
        this.syncOnEveryChange = _.get(data, 'syncOnEveryChange', false);
        this.syncEnabled = _.get(data, 'syncEnabled', true);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return SystemUpstreamServerModel.canView(user); }
    canList(user: UserModel): boolean { return SystemUpstreamServerModel.canList(user); }
    canCreate(user: UserModel): boolean { return SystemUpstreamServerModel.canCreate(user); }
    canModify(user: UserModel): boolean { return SystemUpstreamServerModel.canModify(user); }
    canDelete(user: UserModel): boolean { return SystemUpstreamServerModel.canDelete(user); }

    /**
     * Permissions - IPermissionUpstreamServer
     */
    canSync(user: UserModel): boolean { return SystemUpstreamServerModel.canSync(user); }
    canEnableSync(user: UserModel): boolean { return SystemUpstreamServerModel.canEnableSync(user); }
    canDisableSync(user: UserModel): boolean { return SystemUpstreamServerModel.canDisableSync(user); }
}
