import * as _ from 'lodash';

export enum PERMISSION {
    // users
    USER_LIST = 'user_list',
    USER_VIEW = 'user_view',
    USER_CREATE = 'user_create',
    USER_MODIFY = 'user_modify',
    USER_DELETE = 'user_delete',
    USER_MODIFY_OWN_ACCOUNT = 'user_modify_own_account',

    // outbreaks
    OUTBREAK_LIST = 'outbreak_list',
    OUTBREAK_VIEW = 'outbreak_view',
    OUTBREAK_CREATE = 'outbreak_create',
    OUTBREAK_MODIFY = 'outbreak_modify',
    OUTBREAK_DELETE = 'outbreak_delete',
    OUTBREAK_RESTORE = 'outbreak_restore',
    OUTBREAK_MAKE_ACTIVE = 'outbreak_make_active',
    OUTBREAK_SEE_INCONSISTENCIES = 'outbreak_see_inconsistencies',
    OUTBREAK_MODIFY_CASE_QUESTIONNAIRE = 'outbreak_modify_case_questionnaire',
    OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE = 'outbreak_modify_contact_follow_up_questionnaire',
    OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE = 'outbreak_modify_case_lab_result_questionnaire',
    OUTBREAK_CREATE_CLONE = 'outbreak_create_clone',
READ_OUTBREAK = 'read_outbreak',
WRITE_OUTBREAK = 'write_outbreak',

    // outbreak templates
    OUTBREAK_TEMPLATE_LIST = 'outbreak_template_list',
    OUTBREAK_TEMPLATE_VIEW = 'outbreak_template_view',
    OUTBREAK_TEMPLATE_CREATE = 'outbreak_template_create',
    OUTBREAK_TEMPLATE_MODIFY = 'outbreak_template_modify',
    OUTBREAK_TEMPLATE_DELETE = 'outbreak_template_delete',
    OUTBREAK_TEMPLATE_MODIFY_CASE_QUESTIONNAIRE = 'outbreak_template_modify_case_questionnaire',
    OUTBREAK_TEMPLATE_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE = 'outbreak_template_modify_contact_follow_up_questionnaire',
    OUTBREAK_TEMPLATE_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE = 'outbreak_template_modify_case_lab_result_questionnaire',
    OUTBREAK_TEMPLATE_GENERATE_OUTBREAK = 'outbreak_template_generate_outbreak',

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
    EVENT_VIEW_RELATIONSHIP_CONTACTS = 'event_view_relationship_contacts',
    EVENT_CREATE_RELATIONSHIP_CONTACTS = 'event_create_relationship_contacts',
    EVENT_MODIFY_RELATIONSHIP_CONTACTS = 'event_modify_relationship_contacts',
    EVENT_DELETE_RELATIONSHIP_CONTACTS = 'event_delete_relationship_contacts',
    EVENT_LIST_RELATIONSHIP_EXPOSURES = 'event_list_relationship_exposures',
    EVENT_VIEW_RELATIONSHIP_EXPOSURES = 'event_view_relationship_exposures',
    EVENT_CREATE_RELATIONSHIP_EXPOSURES = 'event_create_relationship_exposures',
    EVENT_MODIFY_RELATIONSHIP_EXPOSURES = 'event_modify_relationship_exposures',
    EVENT_DELETE_RELATIONSHIP_EXPOSURES = 'event_delete_relationship_exposures',
    EVENT_REVERSE_RELATIONSHIP = 'event_reverse_relationship',
    EVENT_WITHOUT_RELATIONSHIPS = 'event_without_relationships',
    EVENT_EXPORT_RELATIONSHIPS = 'event_export_relationships',
    EVENT_SHARE_RELATIONSHIPS = 'event_share_relationships',
    EVENT_CHANGE_SOURCE_RELATIONSHIP = 'event_change_source_relationships',
    EVENT_BULK_DELETE_RELATIONSHIP_CONTACTS = 'event_bulk_delete_relationships_contacts',
    EVENT_BULK_DELETE_RELATIONSHIP_EXPOSURES = 'event_bulk_delete_relationships_exposures',
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
    CONTACT_RESTORE = '...',
    CONTACT_CREATE_CONTACT = '...',
    CONTACT_CREATE_BULK_CONTACT = '...',
    CONTACT_LIST_RELATIONSHIP_CONTACTS = '...',
    CONTACT_VIEW_RELATIONSHIP_CONTACTS = '...',
    CONTACT_CREATE_RELATIONSHIP_CONTACTS = '...',
    CONTACT_MODIFY_RELATIONSHIP_CONTACTS = '...',
    CONTACT_DELETE_RELATIONSHIP_CONTACTS = '...',
    CONTACT_LIST_RELATIONSHIP_EXPOSURES = '...',
    CONTACT_VIEW_RELATIONSHIP_EXPOSURES = '...',
    CONTACT_CREATE_RELATIONSHIP_EXPOSURES = '...',
    CONTACT_MODIFY_RELATIONSHIP_EXPOSURES = '...',
    CONTACT_DELETE_RELATIONSHIP_EXPOSURES = '...',
    CONTACT_REVERSE_RELATIONSHIP = '...',
    CONTACT_EXPORT_RELATIONSHIPS = '...',
    CONTACT_SHARE_RELATIONSHIPS = '...',
    CONTACT_CHANGE_SOURCE_RELATIONSHIP = '...',
    CONTACT_BULK_DELETE_RELATIONSHIP_CONTACTS = '...',
    CONTACT_BULK_DELETE_RELATIONSHIP_EXPOSURES = '...',

    // case
READ_CASE = 'read_case',
WRITE_CASE = 'write_case',
    CASE_LIST = READ_CASE,
    CASE_VIEW = READ_CASE,
    CASE_CREATE = WRITE_CASE,
    CASE_MODIFY = WRITE_CASE,
    CASE_DELETE = WRITE_CASE,
    CASE_RESTORE = '...',
    CASE_CREATE_CONTACT = '...',
    CASE_CREATE_BULK_CONTACT = '...',
    CASE_LIST_RELATIONSHIP_CONTACTS = '...',
    CASE_VIEW_RELATIONSHIP_CONTACTS = '...',
    CASE_CREATE_RELATIONSHIP_CONTACTS = '...',
    CASE_MODIFY_RELATIONSHIP_CONTACTS = '...',
    CASE_DELETE_RELATIONSHIP_CONTACTS = '...',
    CASE_LIST_RELATIONSHIP_EXPOSURES = '...',
    CASE_VIEW_RELATIONSHIP_EXPOSURES = '...',
    CASE_CREATE_RELATIONSHIP_EXPOSURES = '...',
    CASE_MODIFY_RELATIONSHIP_EXPOSURES = '...',
    CASE_DELETE_RELATIONSHIP_EXPOSURES = '...',
    CASE_REVERSE_RELATIONSHIP = '...',
    CASE_WITHOUT_RELATIONSHIPS = '...',
    CASE_EXPORT_RELATIONSHIPS = '...',
    CASE_SHARE_RELATIONSHIPS = '...',
    CASE_CHANGE_SOURCE_RELATIONSHIP = '...',
    CASE_BULK_DELETE_RELATIONSHIP_CONTACTS = '...',
    CASE_BULK_DELETE_RELATIONSHIP_EXPOSURES = '...',

    // relationships
    RELATIONSHIP_LIST = 'relationship_list',
    RELATIONSHIP_VIEW = 'relationship_view',
    RELATIONSHIP_CREATE = 'relationship_create',
    RELATIONSHIP_MODIFY = 'relationship_modify',
    RELATIONSHIP_DELETE = 'relationship_delete',
    RELATIONSHIP_REVERSE = 'relationship_reverse',
    RELATIONSHIP_EXPORT = 'relationship_export',
    RELATIONSHIP_SHARE = 'relationship_share',
    RELATIONSHIP_BULK_DELETE = 'relationship_bulk_delete',

    // no restrictions permissions
    SYSTEM_VERSION_VIEW = 'view_system_version',



    // system config
    READ_SYS_CONFIG = 'read_sys_config',
    WRITE_SYS_CONFIG = 'write_sys_config',

    // reference data
    WRITE_REFERENCE_DATA = 'write_reference_data',

    // roles
    READ_ROLE = 'read_role',
    WRITE_ROLE = 'write_role',

    // teams
    READ_TEAM = 'read_team',
    WRITE_TEAM = 'write_team',

    // reports
    READ_REPORT = 'read_report',

    // followups
    READ_FOLLOWUP = 'read_followup',
    WRITE_FOLLOWUP = 'write_followup',

    // help
    WRITE_HELP = 'write_help',
    APPROVE_HELP = 'approve_help'
}

export interface IPermissionChildModel {
    id: PERMISSION;
    label: string;
    description: string;
    requires?: PERMISSION[];
}

export class PermissionModel {
    // list of permissions that can be excluded from save
    static HIDDEN_PERMISSIONS: IPermissionChildModel[] = [
        {
            id: PERMISSION.SYSTEM_VERSION_VIEW,
            label: 'LNG_ROLE_AVAILABLE_PERMISSIONS_VIEW_SYSTEM_VERSION',
            description: 'LNG_ROLE_AVAILABLE_PERMISSIONS_VIEW_SYSTEM_VERSION_DESCRIPTION'
        }
    ];

    // data
    groupAllId: string;
    groupLabel: string;
    groupDescription: string;
    permissions: IPermissionChildModel[] = [];

    /**
     * Constructor
     */
    constructor(data = null) {
        this.groupAllId = _.get(data, 'groupAllId');
        this.groupLabel = _.get(data, 'groupLabel');
        this.groupDescription = _.get(data, 'groupDescription');
        this.permissions = _.get(data, 'permissions');
    }
}
