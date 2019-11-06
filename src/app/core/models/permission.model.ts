import * as _ from 'lodash';

export enum PERMISSION {
    // events
    LIST_EVENT = 'list_event',
    VIEW_EVENT = 'view_event',
    CREATE_EVENT = 'create_event',
    MODIFY_EVENT = 'modify_event',
    DELETE_EVENT = 'delete_event',
    RESTORE_EVENT = 'restore_event',
WRITE_EVENT = MODIFY_EVENT,



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
    WRITE_CASE = 'write_case',

    // contacts
    READ_CONTACT = 'read_contact',
    WRITE_CONTACT = 'write_contact',

    // followups
    READ_FOLLOWUP = 'read_followup',
    WRITE_FOLLOWUP = 'write_followup',

    // help
    WRITE_HELP = 'write_help',
    APPROVE_HELP = 'approve_help'
}

export class PermissionModel {
    id: PERMISSION;
    label: string;
    description: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.label = _.get(data, 'label');
        this.description = _.get(data, 'description');
    }
}
