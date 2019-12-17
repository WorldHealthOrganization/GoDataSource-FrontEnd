import * as _ from 'lodash';

export enum PERMISSION {
    // no restrictions permissions
    SYSTEM_VERSION_VIEW = 'view_system_version',

    // audit logs
    AUDIT_LOG_LIST = 'audit_log_list',

    // languages
    LANGUAGE_LIST = 'language_list',
    LANGUAGE_VIEW = 'language_view',
    LANGUAGE_CREATE = 'language_create',
    LANGUAGE_MODIFY = 'language_modify',
    LANGUAGE_DELETE = 'language_delete',
    LANGUAGE_EXPORT_TOKENS = 'language_export_tokens',
    LANGUAGE_IMPORT_TOKENS = 'language_import_tokens',

    // help
    HELP_CATEGORY_LIST = 'help_list_category',
    HELP_CATEGORY_VIEW = 'help_view_category',
    HELP_CATEGORY_CREATE = 'help_create_category',
    HELP_CATEGORY_MODIFY = 'help_modify_category',
    HELP_CATEGORY_DELETE = 'help_delete_category',
    HELP_CATEGORY_ITEM_LIST = 'help_list_category_item',
    HELP_CATEGORY_ITEM_VIEW = 'help_view_category_item',
    HELP_CATEGORY_ITEM_CREATE = 'help_create_category_item',
    HELP_CATEGORY_ITEM_MODIFY = 'help_modify_category_item',
    HELP_CATEGORY_ITEM_DELETE = 'help_delete_category_item',
    HELP_CATEGORY_ITEM_APPROVE = 'help_approve_category_item',
WRITE_HELP = 'write_help',
APPROVE_HELP = 'approve_help',

    // users
    USER_LIST = 'user_list',
    USER_VIEW = 'user_view',
    USER_CREATE = 'user_create',
    USER_MODIFY = 'user_modify',
    USER_DELETE = 'user_delete',
    USER_MODIFY_OWN_ACCOUNT = 'user_modify_own_account',
    USER_LIST_FOR_FILTERS = 'user_list_for_filters',

    // roles
    USER_ROLE_LIST = 'user_role_list',
    USER_ROLE_VIEW = 'user_role_view',
    USER_ROLE_CREATE = 'user_role_create',
    USER_ROLE_MODIFY = 'user_role_modify',
    USER_ROLE_DELETE = 'user_role_delete',

    // backups
    BACKUP_LIST = 'backup_list',
    BACKUP_VIEW = 'backup_view',
    BACKUP_CREATE = 'backup_create',
    BACKUP_DELETE = 'backup_delete',
    BACKUP_AUTOMATIC_SETTINGS = 'backup_automatic_settings',
    BACKUP_RESTORE = 'backup_restore',

    // sync logs
    SYNC_LOG_LIST = 'sync_log_list',
    SYNC_LOG_VIEW = 'sync_log_view',
    SYNC_LOG_DELETE = 'sync_log_delete',
    SYNC_LOG_BULK_DELETE = 'sync_log_bulk_delete',
    SYNC_SETTINGS = 'sync_settings',
    SYNC_EXPORT_PACKAGE = 'sync_export_package',
    SYNC_IMPORT_PACKAGE = 'sync_import_package',
    SYNC_SYNCHRONIZE = 'sync_synchronize',

    // upstream servers
    UPSTREAM_SERVER_LIST = 'upstream_server_list',
    UPSTREAM_SERVER_CREATE = 'upstream_server_create',
    UPSTREAM_SERVER_DELETE = 'upstream_server_delete',
    UPSTREAM_SERVER_SYNC = 'upstream_server_sync',
    UPSTREAM_SERVER_ENABLE_SYNC = 'upstream_server_enable_sync',
    UPSTREAM_SERVER_DISABLE_SYNC = 'upstream_server_disable_sync',

    // client applications
    CLIENT_APPLICATION_LIST = 'client_application_list',
    CLIENT_APPLICATION_CREATE = 'client_application_create',
    CLIENT_APPLICATION_DELETE = 'client_application_delete',
    CLIENT_APPLICATION_DOWNLOAD_CONF_FILE = 'client_application_download_conf_file',
    CLIENT_APPLICATION_ENABLE = 'client_application_enable',
    CLIENT_APPLICATION_DISABLE = 'client_application_disable',

    // locations
    LOCATION_LIST = 'location_list',
    LOCATION_VIEW = 'location_view',
    LOCATION_CREATE = 'location_create',
    LOCATION_MODIFY = 'location_modify',
    LOCATION_DELETE = 'location_delete',
    LOCATION_EXPORT = 'location_export',
    LOCATION_IMPORT = 'location_import',
    LOCATION_USAGE = 'location_usage',
    LOCATION_PROPAGATE_GEO_TO_PERSONS = 'location_propagate_geo_to_persons',

    // devices
    DEVICE_LIST = 'device_list',
    DEVICE_VIEW = 'device_view',
    DEVICE_MODIFY = 'device_modify',
    DEVICE_DELETE = 'device_delete',
    DEVICE_LIST_HISTORY = 'device_list_history',
    DEVICE_WIPE = 'device_wipe',

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

    // teams
    TEAM_LIST = 'team_list',
    TEAM_VIEW = 'team_view',
    TEAM_CREATE = 'team_create',
    TEAM_MODIFY = 'team_modify',
    TEAM_DELETE = 'team_delete',
    TEAM_LIST_WORKLOAD = 'team_list_workload',
READ_TEAM = 'read_team',
WRITE_TEAM = 'write_team',

    // clusters
    CLUSTER_LIST = 'cluster_list',
    CLUSTER_VIEW = 'cluster_view',
    CLUSTER_CREATE = 'cluster_create',
    CLUSTER_MODIFY = 'cluster_modify',
    CLUSTER_DELETE = 'cluster_delete',
    CLUSTER_LIST_PEOPLE = 'cluster_list_people',

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

    // follow-ups
    FOLLOW_UP_LIST = 'follow_up_list',
    FOLLOW_UP_VIEW = 'follow_up_view',
    FOLLOW_UP_CREATE = 'follow_up_create',
    FOLLOW_UP_MODIFY = 'follow_up_modify',
    FOLLOW_UP_DELETE = 'follow_up_delete',
READ_FOLLOWUP = 'read_followup',
WRITE_FOLLOWUP = 'write_followup',



    // system config
    READ_SYS_CONFIG = 'read_sys_config',
    WRITE_SYS_CONFIG = 'write_sys_config',

    // reference data
    WRITE_REFERENCE_DATA = 'write_reference_data',

    // reports
    READ_REPORT = 'read_report'
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
