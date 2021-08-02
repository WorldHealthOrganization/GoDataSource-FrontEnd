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

    // reference data
    REFERENCE_DATA_LIST = 'reference_data_list_category',
    REFERENCE_DATA_EXPORT = 'reference_data_export',
    REFERENCE_DATA_IMPORT = 'reference_data_import',
    REFERENCE_DATA_CATEGORY_ITEM_LIST = 'reference_data_list_category_item',
    REFERENCE_DATA_CATEGORY_ITEM_VIEW = 'reference_data_view_category_item',
    REFERENCE_DATA_CATEGORY_ITEM_CREATE = 'reference_data_create_category_item',
    REFERENCE_DATA_CATEGORY_ITEM_MODIFY = 'reference_data_modify_category_item',
    REFERENCE_DATA_CATEGORY_ITEM_DELETE = 'reference_data_delete_category_item',

    // icon
    ICON_LIST = 'icon_list',
    ICON_CREATE = 'icon_create',
    ICON_DELETE = 'icon_delete',

    // users
    USER_LIST = 'user_list',
    USER_VIEW = 'user_view',
    USER_CREATE = 'user_create',
    USER_MODIFY = 'user_modify',
    USER_DELETE = 'user_delete',
    USER_MODIFY_OWN_ACCOUNT = 'user_modify_own_account',
    USER_LIST_FOR_FILTERS = 'user_list_for_filters',
    USER_LIST_WORKLOAD = 'user_list_workload',

    // roles
    USER_ROLE_LIST = 'user_role_list',
    USER_ROLE_VIEW = 'user_role_view',
    USER_ROLE_CREATE = 'user_role_create',
    USER_ROLE_MODIFY = 'user_role_modify',
    USER_ROLE_DELETE = 'user_role_delete',
    USER_ROLE_CREATE_CLONE = 'user_role_create_clone',

    // backups
    BACKUP_LIST = 'backup_list',
    BACKUP_VIEW = 'backup_view',
    BACKUP_CREATE = 'backup_create',
    BACKUP_DELETE = 'backup_delete',
    BACKUP_AUTOMATIC_SETTINGS = 'backup_automatic_settings',
    BACKUP_RESTORE = 'backup_restore',
    BACKUP_VIEW_CLOUD_BACKUP = 'backup_view_cloud_location',

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
    OUTBREAK_MODIFY_CONTACT_QUESTIONNAIRE = 'outbreak_modify_contact_questionnaire',
    OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE = 'outbreak_modify_contact_follow_up_questionnaire',
    OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE = 'outbreak_modify_case_lab_result_questionnaire',
    OUTBREAK_CREATE_CLONE = 'outbreak_create_clone',
    OUTBREAK_IMPORT_RELATIONSHIP = 'relationship_import',

    // outbreak templates
    OUTBREAK_TEMPLATE_LIST = 'outbreak_template_list',
    OUTBREAK_TEMPLATE_VIEW = 'outbreak_template_view',
    OUTBREAK_TEMPLATE_CREATE = 'outbreak_template_create',
    OUTBREAK_TEMPLATE_CREATE_CLONE = 'outbreak_template_create_clone',
    OUTBREAK_TEMPLATE_MODIFY = 'outbreak_template_modify',
    OUTBREAK_TEMPLATE_DELETE = 'outbreak_template_delete',
    OUTBREAK_TEMPLATE_MODIFY_CASE_QUESTIONNAIRE = 'outbreak_template_modify_case_questionnaire',
    OUTBREAK_TEMPLATE_MODIFY_CONTACT_QUESTIONNAIRE = 'outbreak_template_modify_contact_questionnaire',
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
    EVENT_EXPORT = 'event_export',
    EVENT_IMPORT = 'event_import',
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
    EVENT_CHANGE_TARGET_RELATIONSHIP = 'event_change_target_relationships',
    EVENT_BULK_DELETE_RELATIONSHIP_CONTACTS = 'event_bulk_delete_relationships_contacts',
    EVENT_BULK_DELETE_RELATIONSHIP_EXPOSURES = 'event_bulk_delete_relationships_exposures',

    // contacts
    CONTACT_LIST = 'contact_list',
    CONTACT_VIEW = 'contact_view',
    CONTACT_CREATE = 'contact_create',
    CONTACT_MODIFY = 'contact_modify',
    CONTACT_DELETE = 'contact_delete',
    CONTACT_RESTORE = 'contact_restore',
    CONTACT_EXPORT = 'contact_export',
    CONTACT_IMPORT = 'contact_import',
    CONTACT_BULK_CREATE = 'contact_bulk_create',
    CONTACT_BULK_MODIFY = 'contact_bulk_modify',
    CONTACT_CREATE_BULK_CONTACT_OF_CONTACT = 'contact_create_bulk_contact_of_contact',
    CONTACT_GENERATE_VISUAL_ID = 'contact_generate_visual_id',
    CONTACT_LIST_RELATIONSHIP_CONTACTS = 'contact_list_relationship_contacts',
    CONTACT_VIEW_RELATIONSHIP_CONTACTS = 'contact_view_relationship_contacts',
    CONTACT_CREATE_RELATIONSHIP_CONTACTS = 'contact_create_relationship_contacts',
    CONTACT_MODIFY_RELATIONSHIP_CONTACTS = 'contact_modify_relationship_contacts',
    CONTACT_DELETE_RELATIONSHIP_CONTACTS = 'contact_delete_relationship_contacts',
    CONTACT_LIST_RELATIONSHIP_EXPOSURES = 'contact_list_relationship_exposures',
    CONTACT_VIEW_RELATIONSHIP_EXPOSURES = 'contact_view_relationship_exposures',
    CONTACT_CREATE_RELATIONSHIP_EXPOSURES = 'contact_create_relationship_exposures',
    CONTACT_MODIFY_RELATIONSHIP_EXPOSURES = 'contact_modify_relationship_exposures',
    CONTACT_DELETE_RELATIONSHIP_EXPOSURES = 'contact_delete_relationship_exposures',
    CONTACT_EXPORT_RELATIONSHIPS = 'contact_export_relationships',
    CONTACT_SHARE_RELATIONSHIPS = 'contact_share_relationships',
    CONTACT_CHANGE_SOURCE_RELATIONSHIP = 'contact_change_source_relationships',
    CONTACT_CHANGE_TARGET_RELATIONSHIP = 'contact_change_target_relationships',
    CONTACT_BULK_DELETE_RELATIONSHIP_EXPOSURES = 'contact_bulk_delete_relationships_exposures',
    CONTACT_BULK_DELETE_RELATIONSHIP_CONTACTS = 'contact_bulk_delete_relationships_contacts',
    CONTACT_VIEW_MOVEMENT_MAP = 'contact_view_movement_map',
    CONTACT_EXPORT_MOVEMENT_MAP = 'contact_export_movement_map',
    CONTACT_VIEW_CHRONOLOGY_CHART = 'contact_view_chronology_chart',
    CONTACT_CONVERT_TO_CASE = 'contact_convert_to_case',
    CONTACT_EXPORT_DAILY_FOLLOW_UP_LIST = 'contact_export_daily_follow_up_list',
    CONTACT_EXPORT_DAILY_FOLLOW_UP_FORM = 'contact_export_daily_follow_up_form',
    CONTACT_EXPORT_DOSSIER = 'contact_export_dossier',
    CONTACT_VIEW_FOLLOW_UP_REPORT = 'contact_view_follow_up_report',
    CONTACT_COUNT_FROM_FOLLOW_UP = 'contact_count_from_follow_up',
    CONTACT_COUNT_LOST_TO_FOLLOW_UP = 'contact_count_lost_to_follow_up',
    CONTACT_COUNT_NOT_SEEN_IN_X_DAYS = 'contact_count_not_seen_in_x_days',
    CONTACT_COUNT_SEEN = 'contact_count_seen',
    CONTACT_COUNT_SUCCESSFUL_FOLLOW_UPS = 'contact_count_successful_follow_ups',
    CONTACT_EXPORT_FOLLOW_UP_SUCCESS_RATE_REPORT = 'contact_export_follow_up_success_rate_report',
    CONTACT_LIST_LAB_RESULT = 'contact_list_lab_result',
    CONTACT_VIEW_LAB_RESULT = 'contact_view_lab_result',
    CONTACT_CREATE_LAB_RESULT = 'contact_create_lab_result',
    CONTACT_MODIFY_LAB_RESULT = 'contact_modify_lab_result',
    CONTACT_DELETE_LAB_RESULT = 'contact_delete_lab_result',
    CONTACT_RESTORE_LAB_RESULT = 'contact_restore_lab_result',
    CONTACT_IMPORT_LAB_RESULT = 'contact_import_lab_result',
    CONTACT_EXPORT_LAB_RESULT = 'contact_export_lab_result',
    CONTACT_CREATE_CONTACT_OF_CONTACT = 'contact_create_contact_of_contact',

    // contacts of contact
    CONTACT_OF_CONTACT_LIST = 'contact_of_contact_list',
    CONTACT_OF_CONTACT_VIEW = 'contact_of_contact_view',
    CONTACT_OF_CONTACT_CREATE = 'contact_of_contact_create',
    CONTACT_OF_CONTACT_MODIFY = 'contact_of_contact_modify',
    CONTACT_OF_CONTACT_DELETE = 'contact_of_contact_delete',
    CONTACT_OF_CONTACT_RESTORE = 'contact_of_contact_restore',
    CONTACT_OF_CONTACT_EXPORT = 'contact_of_contact_export',
    CONTACT_OF_CONTACT_IMPORT = 'contact_of_contact_import',
    CONTACT_OF_CONTACT_BULK_CREATE = 'contact_of_contact_bulk_create',
    CONTACT_OF_CONTACT_BULK_MODIFY = 'contact_of_contact_bulk_modify',
    CONTACT_OF_CONTACT_GENERATE_VISUAL_ID = 'contact_of_contact_generate_visual_id',
    CONTACT_OF_CONTACT_LIST_RELATIONSHIP_EXPOSURES = 'contact_of_contact_list_relationship_exposures',
    CONTACT_OF_CONTACT_VIEW_RELATIONSHIP_EXPOSURES = 'contact_of_contact_view_relationship_exposures',
    CONTACT_OF_CONTACT_CREATE_RELATIONSHIP_EXPOSURES = 'contact_of_contact_create_relationship_exposures',
    CONTACT_OF_CONTACT_MODIFY_RELATIONSHIP_EXPOSURES = 'contact_of_contact_modify_relationship_exposures',
    CONTACT_OF_CONTACT_DELETE_RELATIONSHIP_EXPOSURES = 'contact_of_contact_delete_relationship_exposures',
    CONTACT_OF_CONTACT_EXPORT_RELATIONSHIPS = 'contact_of_contact_export_relationships',
    CONTACT_OF_CONTACT_SHARE_RELATIONSHIPS = 'contact_of_contact_share_relationships',
    CONTACT_OF_CONTACT_CHANGE_SOURCE_RELATIONSHIP = 'contact_of_contact_change_source_relationships',
    CONTACT_OF_CONTACT_CHANGE_TARGET_RELATIONSHIP = 'contact_of_contact_change_target_relationships',
    CONTACT_OF_CONTACT_BULK_DELETE_RELATIONSHIP_EXPOSURES = 'contact_of_contact_bulk_delete_relationships_exposures',
    CONTACT_OF_CONTACT_VIEW_MOVEMENT_MAP = 'contact_of_contact_view_movement_map',
    CONTACT_OF_CONTACT_EXPORT_MOVEMENT_MAP = 'contact_of_contact_export_movement_map',
    CONTACT_OF_CONTACT_VIEW_CHRONOLOGY_CHART = 'contact_of_contact_view_chronology_chart',
    CONTACT_OF_CONTACT_EXPORT_DOSSIER = 'contact_of_contact_export_dossier',

    // case
    CASE_LIST = 'case_list',
    CASE_VIEW = 'case_view',
    CASE_CREATE = 'case_create',
    CASE_MODIFY = 'case_modify',
    CASE_DELETE = 'case_delete',
    CASE_RESTORE = 'case_restore',
    CASE_IMPORT = 'case_import',
    CASE_EXPORT = 'case_export',
    CASE_CREATE_CONTACT = 'case_create_contact',
    CASE_CREATE_BULK_CONTACT = 'case_create_bulk_contact',
    CASE_GENERATE_VISUAL_ID = 'case_generate_visual_id',
    CASE_LIST_RELATIONSHIP_CONTACTS = 'case_list_relationship_contacts',
    CASE_VIEW_RELATIONSHIP_CONTACTS = 'case_view_relationship_contacts',
    CASE_CREATE_RELATIONSHIP_CONTACTS = 'case_create_relationship_contacts',
    CASE_MODIFY_RELATIONSHIP_CONTACTS = 'case_modify_relationship_contacts',
    CASE_DELETE_RELATIONSHIP_CONTACTS = 'case_delete_relationship_contacts',
    CASE_LIST_RELATIONSHIP_EXPOSURES = 'case_list_relationship_exposures',
    CASE_VIEW_RELATIONSHIP_EXPOSURES = 'case_view_relationship_exposures',
    CASE_CREATE_RELATIONSHIP_EXPOSURES = 'case_create_relationship_exposures',
    CASE_MODIFY_RELATIONSHIP_EXPOSURES = 'case_modify_relationship_exposures',
    CASE_DELETE_RELATIONSHIP_EXPOSURES = 'case_delete_relationship_exposures',
    CASE_REVERSE_RELATIONSHIP = 'case_reverse_relationship',
    CASE_WITHOUT_RELATIONSHIPS = 'case_without_relationships',
    CASE_EXPORT_RELATIONSHIPS = 'case_export_relationships',
    CASE_SHARE_RELATIONSHIPS = 'case_share_relationships',
    CASE_CHANGE_SOURCE_RELATIONSHIP = 'case_change_source_relationships',
    CASE_CHANGE_TARGET_RELATIONSHIP = 'case_change_target_relationships',
    CASE_BULK_DELETE_RELATIONSHIP_CONTACTS = 'case_bulk_delete_relationships_contacts',
    CASE_BULK_DELETE_RELATIONSHIP_EXPOSURES = 'case_bulk_delete_relationships_exposures',
    CASE_VIEW_MOVEMENT_MAP = 'case_view_movement_map',
    CASE_EXPORT_MOVEMENT_MAP = 'case_export_movement_map',
    CASE_VIEW_CHRONOLOGY_CHART = 'case_view_chronology_chart',
    CASE_CONVERT_TO_CONTACT = 'case_convert_to_contact',
    CASE_EXPORT_DOSSIER = 'case_export_dossier',
    CASE_EXPORT_INVESTIGATION_FORM = 'case_export_investigation_form',
    CASE_EXPORT_EMPTY_INVESTIGATION_FORMS = 'case_export_empty_investigation_forms',
    CASE_GROUP_BY_CLASSIFICATION = 'case_grouped_by_classification',
    CASE_LIST_ONSET_BEFORE_PRIMARY_CASE_REPORT = 'case_list_onset_before_primary_case_report',
    CASE_LIST_LONG_PERIOD_BETWEEN_DATES_REPORT = 'case_list_long_period_between_onset_dates_report',
    CASE_LIST_ISOLATED_CASES = 'case_list_isolated_cases',
    CASE_GROUP_BY_LOCATION_LEVEL = 'case_grouped_by_location_level',
    CASE_STRATIFIED_BY_CLASSIFICATION_OVER_TIME = 'case_stratified_by_classification_over_time',
    CASE_STRATIFIED_BY_OUTCOME_OVER_TIME = 'case_stratified_by_outcome_over_time',
    CASE_STRATIFIED_BY_CLASSIFICATION_OVER_REPORTING_TIME = 'case_stratified_by_classification_over_reporting_time',
    CASE_LIST_CASES_BY_PERIOD_AND_CONTACT_STATUS = 'case_list_cases_by_period_and_contact_status',
    CASE_LIST_CASES_WITH_LESS_THAN_X_CONTACTS = 'case_list_cases_with_less_than_x_contacts',
    CASE_LIST_CASES_NEW_IN_PREVIOUS_X_DAYS_DETECTED_AMONG_KNOWN_CONTACTS = 'case_list_cases_new_in_previous_x_days_detected_among_contacts',
    CASE_LIST_CASES_NEW_IN_KNOWN_COT = 'case_list_cases_new_in_known_cot',
    CASE_COUNT_CASES_CONTACTS = 'case_count_case_contacts',
    CASE_EXPORT_CLASSIFICATION_PER_LOCATION_REPORT = 'case_export_classification_per_location_report',
    CASE_LIST_LAB_RESULT = 'case_list_lab_result',
    CASE_VIEW_LAB_RESULT = 'case_view_lab_result',
    CASE_CREATE_LAB_RESULT = 'case_create_lab_result',
    CASE_MODIFY_LAB_RESULT = 'case_modify_lab_result',
    CASE_DELETE_LAB_RESULT = 'case_delete_lab_result',
    CASE_RESTORE_LAB_RESULT = 'case_restore_lab_result',
    CASE_IMPORT_LAB_RESULT = 'case_import_lab_result',
    CASE_EXPORT_LAB_RESULT = 'case_export_lab_result',

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
    FOLLOW_UP_RESTORE = 'follow_up_restore',
    FOLLOW_UP_LIST_RANGE = 'follow_up_list_range',
    FOLLOW_UP_EXPORT = 'follow_up_export',
    FOLLOW_UP_EXPORT_RANGE = 'follow_up_export_range',
    FOLLOW_UP_EXPORT_DAILY_FORM = 'follow_up_export_daily_form',
    FOLLOW_UP_GENERATE = 'follow_up_generate',
    FOLLOW_UP_BULK_MODIFY = 'follow_up_bulk_modify',
    FOLLOW_UP_BULK_DELETE = 'follow_up_bulk_delete',
    FOLLOW_UP_BULK_RESTORE = 'follow_up_bulk_restore',
    FOLLOW_UP_GROUP_BY_TEAM = 'follow_up_grouped_by_team',

    // lab results
    LAB_RESULT_LIST = 'lab_result_list',
    LAB_RESULT_VIEW = 'lab_result_view',
    LAB_RESULT_CREATE = 'lab_result_create',
    LAB_RESULT_MODIFY = 'lab_result_modify',
    LAB_RESULT_DELETE = 'lab_result_delete',
    LAB_RESULT_RESTORE = 'lab_result_restore',
    LAB_RESULT_IMPORT = 'lab_result_import',
    LAB_RESULT_EXPORT = 'lab_result_export',

    // gantt chart
    GANTT_CHART_VIEW_DELAY_ONSET_LAB_TESTING = 'gantt_chart_view_delay_onset_lab_testing',
    GANTT_CHART_VIEW_DELAY_ONSET_HOSPITALIZATION = 'gantt_chart_view_delay_onset_hospitalization',
    GANTT_CHART_EXPORT_DELAY_ONSET_LAB_TESTING = 'gantt_chart_export_delay_onset_lab_testing',
    GANTT_CHART_EXPORT_DELAY_ONSET_HOSPITALIZATION = 'gantt_chart_export_delay_onset_hospitalization',

    // cot
    COT_LIST = 'cot_list',
    COT_EXPORT_BAR_CHART = 'cot_export_bar_chart',
    COT_EXPORT_GRAPHS = 'cot_export_graphs',
    COT_EXPORT_CASE_COUNT_MAP = 'cot_export_case_count_map',
    COT_VIEW_BAR_CHART = 'cot_view_bar_chart',
    COT_VIEW_CASE_COUNT_MAP = 'cot_view_case_count_map',
    COT_VIEW_GEOSPATIAL_MAP = 'cot_view_geospatial_map',
    COT_VIEW_BUBBLE_NETWORK = 'cot_view_bubble_network',
    COT_MODIFY_BUBBLE_NETWORK = 'cot_modify_bubble_network',
    COT_VIEW_HIERARCHICAL_NETWORK = 'cot_view_hierarchical_network',
    COT_MODIFY_HIERARCHICAL_NETWORK = 'cot_modify_hierarchical_network',
    COT_VIEW_TIMELINE_NETWORK_DATE_OF_ONSET = 'cot_view_timeline_network_date_of_onset',
    COT_MODIFY_TIMELINE_NETWORK_DATE_OF_ONSET = 'cot_modify_timeline_network_date_of_onset',
    COT_VIEW_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT = 'cot_view_timeline_network_date_of_last_contact',
    COT_MODIFY_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT = 'cot_modify_timeline_network_date_of_last_contact',
    COT_VIEW_TIMELINE_NETWORK_DATE_OF_REPORTING = 'cot_view_timeline_network_date_of_reporting',
    COT_MODIFY_TIMELINE_NETWORK_DATE_OF_REPORTING = 'cot_modify_timeline_network_date_of_reporting',
    COT_LIST_NEW_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES = 'cot_list_new_from_contacts_became_cases',

    // duplicate
    DUPLICATE_LIST = 'duplicate_list',
    DUPLICATE_MERGE_CASES = 'duplicate_merge_cases',
    DUPLICATE_MERGE_CONTACTS = 'duplicate_merge_contacts',
    DUPLICATE_MERGE_EVENTS = 'duplicate_merge_events',
    DUPLICATE_MERGE_CONTACTS_OF_CONTACTS = 'duplicate_merge_contacts_of_contacts',

    // dashboard
    DASHBOARD_VIEW_CASE_SUMMARY_DASHLET = 'dashboard_view_case_summary_dashlet',
    DASHBOARD_VIEW_CASE_PER_LOCATION_LEVEL_DASHLET = 'dashboard_view_case_per_location_level_dashlet',
    DASHBOARD_VIEW_CASE_HOSPITALIZED_PIE_CHART_DASHLET = 'dashboard_view_case_hospitalized_pie_chart_dashlet',
    DASHBOARD_VIEW_COT_SIZE_HISTOGRAM_DASHLET = 'dashboard_view_cot_size_histogram_dashlet',
    DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_CLASSIFICATION_DASHLET = 'dashboard_view_epi_curve_classification_dashlet',
    DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_OUTCOME_DASHLET = 'dashboard_view_epi_curve_outcome_dashlet',
    DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_REPORTING_DASHLET = 'dashboard_view_epi_curve_reporting_dashlet',
    DASHBOARD_VIEW_CONTACT_FOLLOW_UP_REPORT_DASHLET = 'dashboard_view_contact_follow_up_report_dashlet',
    DASHBOARD_VIEW_CONTACT_STATUS_REPORT_DASHLET = 'dashboard_view_contact_status_report_dashlet',
    DASHBOARD_VIEW_CASE_DECEASED_DASHLET = 'dashboard_view_case_deceased_dashlet',
    DASHBOARD_VIEW_CASE_HOSPITALIZED_DASHLET = 'dashboard_view_case_hospitalized_dashlet',
    DASHBOARD_VIEW_CASE_WITH_LESS_THAN_X_CONTACTS_DASHLET = 'dashboard_view_case_with_less_than_x_contacts_dashlet',
    DASHBOARD_VIEW_CASE_NEW_IN_PREVIOUS_X_DAYS_DETECTED_AMONG_KNOWN_CONTACTS_DASHLET = 'dashboard_view_case_new_in_previous_x_days_detected_among_contacts_dashlet',
    DASHBOARD_VIEW_CASE_REFUSING_TREATMENT_DASHLET = 'dashboard_view_case_refusing_treatment_dashlet',
    DASHBOARD_VIEW_CASE_NEW_FROM_KNOWN_COT_DASHLET = 'dashboard_view_case_new_known_cot_dashlet',
    DASHBOARD_VIEW_CASE_WITH_PENDING_LAB_RESULTS_DASHLET = 'dashboard_view_case_with_pending_lab_results_dashlet',
    DASHBOARD_VIEW_CASE_NOT_IDENTIFIED_THROUGH_CONTACTS_DASHLET = 'dashboard_view_case_not_identified_through_contacts_dashlet',
    DASHBOARD_VIEW_CONTACTS_PER_CASE_MEAN_DASHLET = 'dashboard_view_contacts_per_case_mean_dashlet',
    DASHBOARD_VIEW_CONTACTS_PER_CASE_MEDIAN_DASHLET = 'dashboard_view_contacts_per_case_median_dashlet',
    DASHBOARD_VIEW_CONTACTS_FROM_FOLLOW_UP_DASHLET = 'dashboard_view_contact_from_follow_up_dashlet',
    DASHBOARD_VIEW_CONTACTS_LOST_TO_FOLLOW_UP_DASHLET = 'dashboard_view_contact_lost_to_follow_up_dashlet',
    DASHBOARD_VIEW_CONTACTS_NOT_SEEN_IN_X_DAYS_DASHLET = 'dashboard_view_contact_not_seen_in_x_days_dashlet',
    DASHBOARD_VIEW_CONTACTS_BECOME_CASES_DASHLET = 'dashboard_view_contact_become_case_dashlet',
    DASHBOARD_VIEW_CONTACTS_SEEN_DASHLET = 'dashboard_view_contact_seen_dashlet',
    DASHBOARD_VIEW_CONTACTS_SUCCESSFUL_FOLLOW_UPS_DASHLET = 'dashboard_view_contact_successful_follow_ups_dashlet',
    DASHBOARD_VIEW_INDEPENDENT_COT_DASHLET = 'dashboard_view_independent_cot_dashlet',
    DASHBOARD_VIEW_ACTIVE_COT_DASHLET = 'dashboard_view_active_cot_dashlet',
    DASHBOARD_VIEW_NEW_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES_DASHLET = 'dashboard_view_new_chains_from_contacts_became_cases_dashlet',
    DASHBOARD_EXPORT_CASE_CLASSIFICATION_PER_LOCATION_REPORT = 'dashboard_export_case_classification_per_location_report',
    DASHBOARD_EXPORT_CONTACT_FOLLOW_UP_SUCCESS_RATE_REPORT = 'dashboard_export_contact_follow_up_success_rate_report',
    DASHBOARD_EXPORT_EPI_CURVE = 'dashboard_export_epi_curve',
    DASHBOARD_EXPORT_KPI = 'dashboard_export_kpi'
}

export interface IPermissionChildModel {
    id: PERMISSION;
    label: string;
    description: string;
    requires?: PERMISSION[];
    hidden?: boolean;
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
