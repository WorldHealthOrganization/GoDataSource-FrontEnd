import * as _ from 'lodash';
import { SystemUpstreamServerCredentialsModel } from './system-upstream-server-credentials.model';
import { v4 as uuid } from 'uuid';
import { IPermissionBasic, IPermissionClientApplication } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { BaseModel } from './base.model';

export class SystemClientApplicationModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionClientApplication {

  // data
  id: string;
  name: string;
  credentials: SystemUpstreamServerCredentialsModel;
  active: boolean;
  outbreakIDs: string[];

  // used by ui
  loading: boolean;

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CLIENT_APPLICATION_MODIFY) : false; }
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
    super(data);

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
