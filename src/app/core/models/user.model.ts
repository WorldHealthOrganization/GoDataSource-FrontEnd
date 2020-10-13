// tslint:disable:no-use-before-declare
import * as _ from 'lodash';
import { IPermissionChildModel, PERMISSION, PermissionModel } from './permission.model';
import { SecurityQuestionModel } from './securityQuestion.model';
import { UserSettingsDashboardModel } from './user-settings-dashboard.model';
import { IPermissionBasic, IPermissionCloneable, IPermissionUser } from './permission.interface';

export enum UserSettings {
    AUDIT_LOG_FIELDS = 'auditLogFields',
    DASHBOARD = 'dashboard',
    CASE_FIELDS = 'caseFields',
    CASE_LAB_FIELDS = 'caseLabFields',
    CASE_WITHOUT_RELATIONSHIPS_FIELDS = 'caseWithoutRelationshipsFields',
    CONTACT_LAB_FIELDS = 'contactLabFields',
    CONTACT_FIELDS = 'contactFields',
    CONTACT_OF_CONTACT_FIELDS = 'contactOfContactFields',
    EVENT_FIELDS = 'eventFields',
    EVENT_WITHOUT_RELATIONSHIPS_FIELDS = 'eventWithoutRelationshipsFields',
    LOCATION_FIELDS= 'locationFields',
    LAB_RESULTS_FIELDS = 'labResults',
    RELATIONSHIP_FIELDS = 'relationshipFields',
    OUTBREAK_FIELDS = 'outbreakFields',
    OUTBREAK_MODIFY_QUESTIONNAIRE_FIELDS = 'outbreakModifyQuestionnaireFields',
    OUTBREAK_TEMPLATE_FIELDS = 'outbreakTemplateFields',
    OUTBREAK_TEMPLATE_MODIFY_QUESTIONNAIRE_FIELDS = 'outbreakTemplateModifyQuestionnaireFields',
    CONTACT_DAILY_FOLLOW_UP_FIELDS = 'contactDailyFollowUpFields',
    CASE_RELATED_DAILY_FOLLOW_UP_FIELDS = 'caseRelatedFollowUpFields',
    CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = 'contactRelatedFollowUpFields',
    SYNC_UPSTREAM_SERVERS_FIELDS = 'syncUpstreamServersFields',
    SYNC_CLIENT_APPLICATIONS_FIELDS = 'syncClientApplicationsFields',
    SYNC_LOGS_FIELDS = 'syncLogsFields',
    REF_DATA_CAT_ENTRIES_FIELDS = 'refDataCatEntriesFields',
    SHARE_RELATIONSHIPS = 'shareRelationships',
    USER_ROLE_FIELDS = 'userRoleFields',
    ENTITY_NOT_DUPLICATES_FIELDS = 'entityNotDuplicatesFields',
    USER_FIELDS = 'userFields',
}

/**
 * Custom handlers
 */
abstract class UserSettingsHandlers {
    static AUDIT_LOG_FIELDS = [];
    static DASHBOARD = UserSettingsDashboardModel;
    static CASE_FIELDS = [];
    static CASE_LAB_FIELDS = [];
    static CASE_WITHOUT_RELATIONSHIPS_FIELDS = [];
    static CONTACT_LAB_FIELDS = [];
    static CONTACT_FIELDS = [];
    static CONTACT_OF_CONTACT_FIELDS = [];
    static EVENT_FIELDS = [];
    static EVENT_WITHOUT_RELATIONSHIPS_FIELDS = [];
    static LOCATION_FIELDS = [];
    static LAB_RESULTS_FIELDS = [];
    static RELATIONSHIP_FIELDS = [];
    static OUTBREAK_FIELDS = [];
    static OUTBREAK_MODIFY_QUESTIONNAIRE_FIELDS = [];
    static OUTBREAK_TEMPLATE_FIELDS = [];
    static OUTBREAK_TEMPLATE_MODIFY_QUESTIONNAIRE_FIELDS = [];
    static CONTACT_DAILY_FOLLOW_UP_FIELDS = [];
    static CASE_RELATED_DAILY_FOLLOW_UP_FIELDS = [];
    static CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = [];
    static SYNC_UPSTREAM_SERVERS_FIELDS = [];
    static SYNC_CLIENT_APPLICATIONS_FIELDS = [];
    static SYNC_LOGS_FIELDS = [];
    static REF_DATA_CAT_ENTRIES_FIELDS = [];
    static SHARE_RELATIONSHIPS = [];
    static USER_ROLE_FIELDS = [];
    static ENTITY_NOT_DUPLICATES_FIELDS = [];
    static USER_FIELDS = [];
}

export enum PhoneNumberType {
    PRIMARY_PHONE_NUMBER = 'LNG_USER_FIELD_LABEL_PRIMARY_TELEPHONE'
}

export interface IPermissionExpressionAnd {
    and: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[];
}

export interface IPermissionExpressionOr {
    or: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[];
}

export class PermissionExpression {
    /**
     * Constructor
     */
    constructor(
        public permission: PERMISSION |
            IPermissionExpressionAnd |
            IPermissionExpressionOr |
            ((UserModel) => boolean)
    ) {}

    /**
     * Check if an user passes required permissions from this model
     * @param authUser
     */
    allowed(authUser: UserModel): boolean {
        // check recursively if we have access
        if (typeof this.permission === 'object') {
            // and / or conditions
            if ((this.permission as any).and !== undefined) {
                // go through and see if all conditions match
                const permission: IPermissionExpressionAnd = this.permission as IPermissionExpressionAnd;
                for (const condition of permission.and) {
                    // if complex expression then we need to check further
                    if (condition instanceof PermissionExpression) {
                        if (!condition.allowed(authUser)) {
                            return false;
                        }

                    // check if condition is function
                    } else if (typeof condition === 'function') {
                        if (!condition(authUser)) {
                            return false;
                        }

                    // check if user has this permission
                    } else if (!authUser.permissionIdsMapped[condition]) {
                        return false;
                    }
                }

                // all match
                return true;
            } else if ((this.permission as any).or !== undefined) {
                // go through and see if at least one condition matches
                const permission: IPermissionExpressionOr = this.permission as IPermissionExpressionOr;
                for (const condition of permission.or) {
                    // if complex expression then we need to check further
                    if (condition instanceof PermissionExpression) {
                        if (condition.allowed(authUser)) {
                            return true;
                        }

                        // check if condition is function
                    } else if (typeof condition === 'function') {
                        if (condition(authUser)) {
                            return true;
                        }

                    // check if user has this permission
                    } else if (authUser.permissionIdsMapped[condition]) {
                        return true;
                    }
                }

                // no match ?
                return false;
            }

            // invalid object
            return false;
        }

        // simple permission
        return typeof this.permission === 'function' ?
            this.permission(authUser) :
            !!authUser.permissionIdsMapped[this.permission];
    }
}

export class UserRoleModel
    implements
        IPermissionBasic,
        IPermissionCloneable {
    id: string | null;
    name: string | null;
    permissionIds: PERMISSION[];
    description: string | null;
    permissions: IPermissionChildModel[];

    users: UserModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_VIEW, PERMISSION.USER_ROLE_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_DELETE) : false; }

    /**
     * Static Permissions - IPermissionCloneable
     */
    static canClone(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_ROLE_CREATE_CLONE) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.permissionIds = _.get(data, 'permissionIds', []);
        this.description = _.get(data, 'description');

        this.users = _.get(data, 'users', [])
            .map((userData) => {
                return new UserModel(userData);
            });
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return UserRoleModel.canView(user); }
    canList(user: UserModel): boolean { return UserRoleModel.canList(user); }
    canCreate(user: UserModel): boolean { return UserRoleModel.canCreate(user); }
    canModify(user: UserModel): boolean { return UserRoleModel.canModify(user); }
    canDelete(user: UserModel): boolean { return UserRoleModel.canDelete(user); }

    /**
     * Permissions - IPermissionCloneable
     */
    canClone(user: UserModel): boolean { return UserRoleModel.canClone(user); }
}

export class UserModel
    implements
        IPermissionBasic,
        IPermissionUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordChange: boolean;
    outbreakIds: string[];
    activeOutbreakId: string;
    languageId: string;
    roleIds: string[];
    roles: UserRoleModel[] = [];
    disregardGeographicRestrictions: boolean;

    // used to determine if permissions changed from last time we used this key
    private _permissionIdsHash: number;
    get permissionIdsHash(): number {
        return this._permissionIdsHash;
    }

    // list of permissions for current user
    private _permissionIds: PERMISSION[] = [];
    permissionIdsMapped: {
        [permissionId: string]: boolean
    } = {};
    set permissionIds(permissionIds: PERMISSION[]) {
        // user permissions
        this._permissionIds = permissionIds;

        // user permissions for easy access
        this._permissionIdsHash = 0;
        this.permissionIdsMapped = _.transform(permissionIds, (a, v) => {
            // map
            a[v] = true;

            // concatenate to determine hash later
            for (let i = 0; i < v.length; i++) {
                const char = v.charCodeAt(i);
                // tslint:disable-next-line:no-bitwise
                this._permissionIdsHash = ((this._permissionIdsHash << 5) - this._permissionIdsHash) + char;
            }
        }, {});
    }
    get permissionIds(): PERMISSION[] {
        return this._permissionIds;
    }

    securityQuestions: SecurityQuestionModel[] = [];
    settings: { [key: string]: any } = {};
    institutionName: string;
    telephoneNumbers: {
        [key: string]: string
    };

    availablePermissions: PermissionModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_VIEW, PERMISSION.USER_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_DELETE) : false; }

    /**
     * Static Permissions - IPermissionUser
     */
    static canModifyOwnAccount(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_MODIFY_OWN_ACCOUNT) : false; }
    static canListForFilters(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.USER_LIST_FOR_FILTERS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.email = _.get(data, 'email');
        this.password = _.get(data, 'password');
        this.passwordChange = _.get(data, 'passwordChange', false);
        this.outbreakIds = _.get(data, 'outbreakIds', []);
        this.activeOutbreakId = _.get(data, 'activeOutbreakId');
        this.languageId = _.get(data, 'languageId');
        this.roleIds = _.get(data, 'roleIds', []);
        this.securityQuestions = _.get(data, 'securityQuestions', [new SecurityQuestionModel(), new SecurityQuestionModel()]);
        this.availablePermissions = _.get(data, 'availablePermissions');
        this.institutionName = _.get(data, 'institutionName');
        this.telephoneNumbers = _.get(data, 'telephoneNumbers', {});
        this.disregardGeographicRestrictions = _.get(data, 'disregardGeographicRestrictions', false);

        // initialize all settings
        this.initializeSettings(data);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return UserModel.canView(user); }
    canList(user: UserModel): boolean { return UserModel.canList(user); }
    canCreate(user: UserModel): boolean { return UserModel.canCreate(user); }
    canModify(user: UserModel): boolean { return UserModel.canModify(user); }
    canDelete(user: UserModel): boolean { return UserModel.canDelete(user); }

    /**
     * Permissions - IPermissionUser
     */
    canModifyOwnAccount(user: UserModel): boolean { return UserModel.canModifyOwnAccount(user); }
    canListForFilters(user: UserModel): boolean { return UserModel.canListForFilters(user); }

    /**
     * Check if user has specific permissions
     */
    hasPermissions(...permissionIds: (PERMISSION | PermissionExpression | ((UserModel) => boolean))[]): boolean {
        // do we have anything to check ?
        if (
            !permissionIds ||
            permissionIds.length < 1
        ) {
            return true;
        }

        // just one, then there is no point to loop
        // optimization ?
        if (permissionIds.length === 1) {
            // expression ?
            const permission = permissionIds[0];
            if (permission instanceof PermissionExpression) {
                return permission.allowed(this);
            } else if (typeof permission === 'function') {
                return permission(this);
            }

            // simple permissions
            return this.permissionIdsMapped[permission as PERMISSION];
        }

        // check if all permissions are in our list allowed permissions
        for (const permission of permissionIds) {
            if (
                (
                    permission instanceof PermissionExpression &&
                    !permission.allowed(this)
                ) || (
                    typeof permission === 'function' &&
                    !permission(this)
                ) || (
                    !(permission instanceof PermissionExpression) &&
                    !(typeof permission === 'function') &&
                    !this.permissionIdsMapped[permission as PERMISSION]
                )
            ) {
                return false;
            }
        }

        // all permissions are allowed
        return true;
    }

    hasRole(roleId): boolean {
        return _.indexOf(this.roleIds, roleId) >= 0;
    }

    /**
     * Initialize settings
     */
    private initializeSettings(data) {
        _.each(UserSettings, (property: string, enumKey: string) => {
            // retrieve settings
            const settings = _.get(
                data,
                `settings.${property}`
            );

            // initialize settings
            this.settings[property] = UserSettingsHandlers[enumKey] !== undefined ? (
                    _.isArray(UserSettingsHandlers[enumKey]) ?
                        (_.isEmpty(settings) ? [] : settings) :
                        new UserSettingsHandlers[enumKey](settings)
                ) :
                settings;
        });
    }

    /**
     * Retrieve settings
     * @param key
     */
    getSettings(key: UserSettings) {
        return this.settings[key];
    }

    /**
     * User Name
     * @returns {string}
     */
    get name(): string {
        const firstName = _.get(this, 'firstName', '');
        const lastName = _.get(this, 'lastName', '');
        return _.trim(`${firstName} ${lastName}`);
    }
}
