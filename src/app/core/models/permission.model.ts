import * as _ from 'lodash';

export enum PERMISSION {
    // events
    EVENT_LIST = 'event_list',
    EVENT_VIEW = 'event_view',
    EVENT_CREATE = 'event_create',
    EVENT_MODIFY = 'event_modify',
    EVENT_DELETE = 'event_delete',
    EVENT_RESTORE = 'event_restore',
    EVENT_CREATE_CONTACT = 'event_create_contact',
    EVENT_CREATE_BULK_CONTACT = 'event_create_bulk_contact',
    EVENT_LIST_RELATIONSHIP_CONTACTS = 'event_list_relationship_contacts',
    EVENT_VIEW_RELATIONSHIP_CONTACTS = '...',
    EVENT_CREATE_RELATIONSHIP_CONTACTS = '...',
    EVENT_MODIFY_RELATIONSHIP_CONTACTS = '...',
    EVENT_LIST_RELATIONSHIP_EXPOSURES = 'event_list_relationship_exposures',
    EVENT_VIEW_RELATIONSHIP_EXPOSURES = '...',
    EVENT_CREATE_RELATIONSHIP_EXPOSURES = '...',
    EVENT_MODIFY_RELATIONSHIP_EXPOSURES = '...',
WRITE_EVENT = EVENT_MODIFY,

    // contacts
READ_CONTACT = 'read_contact',
WRITE_CONTACT = 'write_contact',
    CONTACT_LIST = READ_CONTACT,
    CONTACT_VIEW = READ_CONTACT,
    CONTACT_CREATE = WRITE_CONTACT,
    CONTACT_MODIFY = WRITE_CONTACT,
    CONTACT_DELETE = WRITE_CONTACT,
    CONTACT_BULK_CREATE = WRITE_CONTACT,

    // relationships
    RELATIONSHIP_LIST = 'relationship_list',
    RELATIONSHIP_VIEW = 'relationship_view',
    RELATIONSHIP_CREATE = 'relationship_create',
    RELATIONSHIP_MODIFY = 'relationship_modify',
    RELATIONSHIP_DELETE = 'relationship_delete',



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
