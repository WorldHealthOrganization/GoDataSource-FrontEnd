import * as _ from 'lodash';
import { environment } from '../../../environments/environment';
import { IPermissionBasic } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class IconModel
implements
        IPermissionBasic {
  id: string;
  name: string;

  url: string;

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(): boolean { return false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.ICON_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.ICON_CREATE) : false; }
  static canModify(): boolean { return false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.ICON_DELETE) : false; }

  /**
     * Constructor
     */
  constructor(data = null) {
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');

    if (this.id) {
      this.url = `${environment.apiUrl}/icons/${this.id}/download`;
    }
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(): boolean { return IconModel.canView(); }
  canList(user: UserModel): boolean { return IconModel.canList(user); }
  canCreate(user: UserModel): boolean { return IconModel.canCreate(user); }
  canModify(): boolean { return IconModel.canModify(); }
  canDelete(user: UserModel): boolean { return IconModel.canDelete(user); }
}
