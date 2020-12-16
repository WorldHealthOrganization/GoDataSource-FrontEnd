import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';
import { OutbreakModel } from './outbreak.model';
import { v4 as uuid } from 'uuid';
import { IPermissionBasic, IPermissionClientApplication } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class SystemClientApplicationModel
    implements
        IPermissionBasic,
        IPermissionClientApplication {
    id: string;
    name: string;
    credentials: SystemUpstreamServerCredentialsModel;
    active: boolean;

    outbreakIDs: string[];
    outbreaks: OutbreakModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_CREATE) : false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_DELETE) : false; }

    /**
     * Static Permissions - IPermissionClientApplication
     */
    static canDownloadConfFile(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_DOWNLOAD_CONF_FILE) : false; }
    static canEnable(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_ENABLE) : false; }
    static canDisable(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_DISABLE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id', uuid());
        this.name = _.get(data, 'name');
        this.credentials = new SystemUpstreamServerCredentialsModel(_.get(data, 'credentials'));
        this.active = _.get(data, 'active', true);
        this.outbreakIDs = _.get(data, 'outbreakIDs', []);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return SystemClientApplicationModel.canView(user); }
    canList(user: UserModel): boolean { return SystemClientApplicationModel.canList(user); }
    canCreate(user: UserModel): boolean { return SystemClientApplicationModel.canCreate(user); }
    canModify(user: UserModel): boolean { return SystemClientApplicationModel.canModify(user); }
    canDelete(user: UserModel): boolean { return SystemClientApplicationModel.canDelete(user); }

    /**
     * Permissions - IPermissionClientApplication
     */
    canDownloadConfFile(user: UserModel): boolean { return SystemClientApplicationModel.canDownloadConfFile(user); }
    canEnable(user: UserModel): boolean { return SystemClientApplicationModel.canEnable(user); }
    canDisable(user: UserModel): boolean { return SystemClientApplicationModel.canDisable(user); }
}
