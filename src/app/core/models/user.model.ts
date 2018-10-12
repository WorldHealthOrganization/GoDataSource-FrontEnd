import * as _ from 'lodash';
import { UserRoleModel } from './user-role.model';
import { PERMISSION } from './permission.model';
import { SecurityQuestionModel } from './securityQuestion.model';
import { UserSettingsDashboardModel } from './user-settings-dashboard.model';

export enum UserSettings {
    DASHBOARD = 'dashboard',
    CASE_FIELDS = 'caseFields',
    CASE_LAB_FIELDS = 'caseLabFields',
    CONTACT_FIELDS = 'contactFields',
    EVENT_FIELDS = 'eventFields',
    RELATIONSHIP_FIELDS = 'relationshipFields',
    OUTBREAK_FIELDS = 'outbreakFields',
    OUTBREAK_TEMPLATE_FIELDS = 'outbreakTemplateFields',
    FOLLOW_UPS_MISSED_FIELDS = 'missedFollowUpFields',
    FOLLOW_UPS_UPCOMING_FIELDS = 'upcomingFollowUpFields',
    FOLLOW_UPS_PAST_FIELDS = 'pastFollowUpFields',
    UPSTREAM_SERVERS_FIELDS = 'upstreamServersFields'
}

/**
 * Custom handlers
 */
abstract class UserSettingsHandlers {
    static DASHBOARD = UserSettingsDashboardModel;
    static CASE_FIELDS = [];
    static CASE_LAB_FIELDS = [];
    static CONTACT_FIELDS = [];
    static EVENT_FIELDS = [];
    static RELATIONSHIP_FIELDS = [];
    static OUTBREAK_FIELDS = [];
    static FOLLOW_UPS_MISSED_FIELDS = [];
    static FOLLOW_UPS_UPCOMING_FIELDS = [];
    static FOLLOW_UPS_PAST_FIELDS = [];
}

export class UserModel {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordChange: boolean;
    activeOutbreakId: string;
    languageId: string;
    roleIds: string[];
    roles: UserRoleModel[] = [];
    permissionIds: PERMISSION[] = [];
    securityQuestions: SecurityQuestionModel[] = [];
    settings: { [key: string]: any } = {};

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.email = _.get(data, 'email');
        this.password = _.get(data, 'password');
        this.passwordChange = _.get(data, 'passwordChange', false);
        this.activeOutbreakId = _.get(data, 'activeOutbreakId');
        this.languageId = _.get(data, 'languageId');
        this.roleIds = _.get(data, 'roleIds', []);
        this.securityQuestions = _.get(data, 'securityQuestions', [new SecurityQuestionModel(), new SecurityQuestionModel()]);

        // initialize all settings
        this.initializeSettings(data);
    }

    hasPermissions(...permissionIds: PERMISSION[]): boolean {
        // ensure that the permission IDs list has unique elements
        permissionIds = _.uniq(permissionIds);

        // get the permissions that the user has
        const havingPermissions = _.filter(permissionIds, (permissionId) => {
            return this.permissionIds.indexOf(permissionId) >= 0;
        });

        // user must have all permissions
        return havingPermissions.length === permissionIds.length;
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
}
