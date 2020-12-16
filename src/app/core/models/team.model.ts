import * as _ from 'lodash';
import { UserModel } from './user.model';
import { LocationModel } from './location.model';
import { IPermissionBasic, IPermissionTeam } from './permission.interface';
import { PERMISSION } from './permission.model';

export class TeamModel
    implements
        IPermissionBasic,
        IPermissionTeam {
    id: string;
    name: string;
    userIds: string[];
    members: UserModel[] = [];
    locationIds: string[];
    locations: LocationModel[] = [];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_DELETE) : false; }

    /**
     * Static Permissions - IPermissionTeam
     */
    static canListWorkload(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.TEAM_LIST_WORKLOAD) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.userIds = _.get(data, 'userIds', []);
        this.locationIds = _.get(data, 'locationIds', []);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return TeamModel.canView(user); }
    canList(user: UserModel): boolean { return TeamModel.canList(user); }
    canCreate(user: UserModel): boolean { return TeamModel.canCreate(user); }
    canModify(user: UserModel): boolean { return TeamModel.canModify(user); }
    canDelete(user: UserModel): boolean { return TeamModel.canDelete(user); }

    /**
     * Permissions - IPermissionTeam
     */
    canListWorkload(user: UserModel): boolean { return TeamModel.canListWorkload(user); }
}

