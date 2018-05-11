import * as _ from 'lodash';

export enum PERMISSION {
    // system config
    READ_SYS_CONFIG = 'read_sys_config',
    WRITE_SYS_CONFIG = 'write_sys_config',

    // reference data
    WRITE_REFERENCE_DATA = 'write_reference_data',

    // users
    READ_USER_ACCOUNT = 'read_user_account',
    WRITE_USER_ACCOUNT = 'write_user_account',

    // roles
    READ_ROLE = 'read_role',
    WRITE_ROLE = 'write_role',

    // outbreaks
    READ_OUTBREAK = 'read_outbreak',
    WRITE_OUTBREAK = 'write_outbreak',

    // teams
    READ_TEAM = 'read_team',
    WRITE_TEAM = 'write_team',

    // reports
    READ_REPORT = 'read_report',

    // cases
    READ_CASE = 'read_case',
    WRITE_OWN_CASE = 'write_own_case',
    WRITE_CASE = 'write_case',

    // contacts
    READ_CONTACT = 'read_contact',
    WRITE_OWN_CONTACT = 'write_own_contact',
    WRITE_CONTACT = 'write_contact',

    // followups
    READ_FOLLOWUP = 'read_followup',
    WRITE_FOLLOWUP = 'write_followup'
}

export class UserRoleModel {
    id: string;
    name: string;
    permissions: string[];

    constructor(data) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.permissions = _.get(data, 'permissions', []);
    }

    /**
     * Check if a user role has one or more permissions
     * @param {string} permissions
     * @returns {boolean} Returns false if at least one permission is missing
     */
    hasPermissions(...permissions: string[]) {
        let i;
        for (i in permissions) {
            // check each permission
            if (this.permissions.indexOf(permissions[i]) < 0) {
                return false;
            }
        }

        return true;
    }
}
