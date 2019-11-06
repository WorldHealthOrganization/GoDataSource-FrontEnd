import * as _ from 'lodash';
import { UserRoleModel } from './user-role.model';
import { PERMISSION } from './permission.model';
import { SecurityQuestionModel } from './securityQuestion.model';
import { UserSettingsDashboardModel } from './user-settings-dashboard.model';

export enum UserSettings {
    AUDIT_LOG_FIELDS = 'auditLogFields',
    DASHBOARD = 'dashboard',
    CASE_FIELDS = 'caseFields',
    CASE_LAB_FIELDS = 'caseLabFields',
    CONTACT_FIELDS = 'contactFields',
    EVENT_FIELDS = 'eventFields',
    LOCATION_FIELDS= 'locationFields',
    LAB_RESULTS_FIELDS = 'labResults',
    RELATIONSHIP_FIELDS = 'relationshipFields',
    OUTBREAK_FIELDS = 'outbreakFields',
    OUTBREAK_TEMPLATE_FIELDS = 'outbreakTemplateFields',
    CONTACT_DAILY_FOLLOW_UP_FIELDS = 'contactDailyFollowUpFields',
    CASE_RELATED_DAILY_FOLLOW_UP_FIELDS = 'caseRelatedFollowUpFields',
    CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = 'contactRelatedFollowUpFields',
    SYNC_UPSTREAM_SERVERS_FIELDS = 'syncUpstreamServersFields',
    SYNC_CLIENT_APPLICATIONS_FIELDS = 'syncClientApplicationsFields',
    SYNC_LOGS_FIELDS = 'syncLogsFields',
    REF_DATA_CAT_ENTRIES_FIELDS = 'refDataCatEntriesFields',
    SHARE_RELATIONSHIPS = 'shareRelationships'
}

/**
 * Custom handlers
 */
abstract class UserSettingsHandlers {
    static AUDIT_LOG_FIELDS = [];
    static DASHBOARD = UserSettingsDashboardModel;
    static CASE_FIELDS = [];
    static CASE_LAB_FIELDS = [];
    static CONTACT_FIELDS = [];
    static EVENT_FIELDS = [];
    static LOCATION_FIELDS = [];
    static LAB_RESULTS_FIELDS = [];
    static RELATIONSHIP_FIELDS = [];
    static OUTBREAK_FIELDS = [];
    static OUTBREAK_TEMPLATE_FIELDS = [];
    static CONTACT_DAILY_FOLLOW_UP_FIELDS = [];
    static CASE_RELATED_DAILY_FOLLOW_UP_FIELDS = [];
    static CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS = [];
    static SYNC_UPSTREAM_SERVERS_FIELDS = [];
    static SYNC_CLIENT_APPLICATIONS_FIELDS = [];
    static SYNC_LOGS_FIELDS = [];
    static REF_DATA_CAT_ENTRIES_FIELDS = [];
    static SHARE_RELATIONSHIPS = [];
}

export class UserModel {
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

    private _permissionIds: PERMISSION[] = [];
    permissionIdsMapped: {
        [permissionId: string]: boolean
    } = {};
    set permissionIds(permissionIds: PERMISSION[]) {
        this._permissionIds = permissionIds;
        this.permissionIdsMapped = _.transform(permissionIds, (a, v) => {
            a[v] = true;
        }, {});
    }
    get permissionIds(): PERMISSION[] {
        return this._permissionIds;
    }

    securityQuestions: SecurityQuestionModel[] = [];
    settings: { [key: string]: any } = {};

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

        // initialize all settings
        this.initializeSettings(data);
    }

    hasPermissions(...permissionIds: PERMISSION[]): boolean {
        // check if all permissions are in our list allowed permissions
        for (const permission of permissionIds) {
            if (!this.permissionIdsMapped[permission]) {
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
