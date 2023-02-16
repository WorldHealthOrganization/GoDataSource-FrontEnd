import { moment, Moment } from '../helperClasses/x-moment';

/**
 * Export status steps
 */
export enum ExportStatusStep {
  LNG_STATUS_STEP_RETRIEVING_LANGUAGE_TOKENS = 'LNG_STATUS_STEP_RETRIEVING_LANGUAGE_TOKENS',
  LNG_STATUS_STEP_PREPARING_PREFILTERS = 'LNG_STATUS_STEP_PREPARING_PREFILTERS',
  LNG_STATUS_STEP_PREPARING_RECORDS = 'LNG_STATUS_STEP_PREPARING_RECORDS',
  LNG_STATUS_STEP_PREPARING_LOCATIONS = 'LNG_STATUS_STEP_PREPARING_LOCATIONS',
  LNG_STATUS_STEP_CONFIGURE_HEADERS = 'LNG_STATUS_STEP_CONFIGURE_HEADERS',
  LNG_STATUS_STEP_EXPORTING_RECORDS = 'LNG_STATUS_STEP_EXPORTING_RECORDS',
  LNG_STATUS_STEP_ENCRYPT = 'LNG_STATUS_STEP_ENCRYPT',
  LNG_STATUS_STEP_ARCHIVE = 'LNG_STATUS_STEP_ARCHIVE',
  LNG_STATUS_STEP_EXPORT_FINISHED = 'LNG_STATUS_STEP_EXPORT_FINISHED'
}

/**
 * Apply List Filter
 */
export enum ApplyListFilter {
  CONTACTS_FOLLOWUP_LIST = 'contacts_followup_list',
  CASES_DECEASED = 'cases_deceased',
  CASES_HOSPITALISED = 'cases_hospitalised',
  CASES_DATE_RANGE_SUMMARY = 'cases_date_range_summary',
  CONTACTS_LOST_TO_FOLLOW_UP = 'contacts_lost_to_follow_up',
  CONTACTS_NOT_SEEN = 'contacts_not_seen',
  CONTACTS_SEEN = 'contacts_seen',
  CONTACTS_FOLLOWED_UP = 'contacts_followed_up',
  CASES_LESS_CONTACTS = 'cases_less_contacts',
  CASES_IN_THE_TRANSMISSION_CHAINS = 'cases_in_the_transmission_chains',
  CASES_PREVIOUS_DAYS_CONTACTS = 'cases_previous_days_contacts',
  CASES_NOT_IDENTIFIED_THROUGH_CONTACTS = 'cases-not-identified-through-contacts',
  CASES_PENDING_LAB_RESULT = 'cases_pending_lab_result',
  CASES_REFUSING_TREATMENT = 'cases_refusing_treatment',
  CONTACTS_BECOME_CASES = 'contacts_become_cases',
  NO_OF_ACTIVE_TRANSMISSION_CHAINS = 'number_of_active_chains',
  NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES = 'no_of_new_chains_of_transmission_from_contacts_who_become_cases',
  CASES_WITHOUT_RELATIONSHIPS  = 'cases_without_relationships',
  EVENTS_WITHOUT_RELATIONSHIPS  = 'events_without_relationships',
  CASES_WITHOUT_DATE_OF_ONSET_CHAIN = 'cases_without_date_of_onset_chain',
  CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN = 'cases_without_date_of_last_contact_chain',
  CASES_WITHOUT_DATE_OF_REPORTING_CHAIN = 'cases_without_date_of_reporting_chain',
  CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN = 'contacts_without_date_of_last_contact_chain',
  CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN = 'contacts_without_date_of_reporting_chain',
  EVENTS_WITHOUT_DATE_CHAIN = 'events_without_date_chain',
  EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN = 'events_without_date_of_reporting_chain',
  CONTEXT_SENSITIVE_HELP_ITEMS = 'context_sensitive_help_items',
  CASE_SUMMARY = 'case-summary',
  CASES_BY_LOCATION = 'cases-by-location'
}

export class Constants {
  // default display constants
  static DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';
  static DEFAULT_DATE_TIME_DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

  // default random configs
  static DEFAULT_RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  static DEFAULT_RANDOM_KEY_LENGTH = 16;

  // default configurations
  static DEFAULT_DEBOUNCE_TIME_MILLISECONDS = 500;
  static DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS = 500;
  static DEFAULT_FILTER_POOLING_MS_CHECK_AGAIN = 2000; // 2 seconds ?

  // pagination defaults and configuration
  static PAGE_SIZE_OPTIONS = [50, 100, 500, 1000];
  static DEFAULT_PAGE_SIZE = 50;

  // static gender
  static readonly GENDER_MALE = 'LNG_REFERENCE_DATA_CATEGORY_GENDER_MALE';

  // dialog constants
  static DIALOG = {
    DATA_ITEM_TYPE: {
      LINK: 'LINK'
    }
  };

  // don't load cached filters ?
  static DONT_LOAD_STATIC_FILTERS_KEY = 'dontLoadStaticFilters';

  // AGE constants
  static DEFAULT_AGE_MAX_YEARS = 150;

  // default color to display nodes in graph when they match the search
  static DEFAULT_GRAPH_NODE_MATCH_FILTER_COLOR = '#00FFE5';

  // node has more than 1 lab sequences
  static DEFAULT_GRAPH_NODE_HAS_MORE_LAB_SEQ_COLOR = '#00FFE5';

  // default color used by reference data
  static DEFAULT_COLOR_REF_DATA = '#CCC';

  // default color to be used in chains of transmission
  static DEFAULT_COLOR_CHAINS = '#A8A8A8';

  // default color to be used in chains - timeline checkpoints
  static DEFAULT_BACKGROUND_COLOR_NODES_CHAINS = '#fff';

  // default color to be used in chains - timeline checkpoints - border
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_BORDER = '#dcdcdc';

  // default color to be used in chains - timeline checkpoints - text
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_TEXT = '#727272';

  // default color to be used in chains - timeline checkpoints - first day of week - border
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_WEEK_BORDER = '#2A2A2A';

  // default color to be used in chains - timeline checkpoints - first day of week - text
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_WEEK_TEXT = '#2A2A2A';

  // default color to be used in chains - timeline checkpoints - first day of month - border
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_MONTH_BORDER = '#4DB0A0';

  // default color to be used in chains - timeline checkpoints - first day of month - text
  static DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_MONTH_TEXT = '#3A9A8A';

  // default color to be used in dashboard - contact follow up report
  static DEFAULT_COLOR_CHART_CONTACTS_NOT_FOLLOWED = '#ED7D31';

  // default color to be used in dashboard - contact follow up report
  static DEFAULT_COLOR_CHART_CONTACTS_FOLLOWED = '#00B0F0';

  // default color to be used in dashboard - contact follow up report
  static DEFAULT_COLOR_CHART_CONTACTS_PERCENTAGE = '#000000';

  // default color to be used in dashboard - cases based on contact status
  static DEFAULT_COLOR_CHART_CASE_NOT_FROM_CONTACT = '#A6A6A6';

  // default color to be used in dashboard - cases based on contact status
  static DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_FOLLOW_UP_COMPLETE = '#70AD47';

  // default color to be used in dashboard - cases based on contact status
  static DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_LOST_TO_FOLLOW_UP = '#ED7D31';

  // default color to be used in dashboard - cases based on contact status
  static DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_PERCENTAGE = '#FFC000';

  // these need to be hardcoded, this is why we don't pull them from reference data
  // they are in reference data only to disable some options or translate labels ( since answer type category is readonly )
  static ANSWER_TYPES = {
    DATE_TIME: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_DATE_TIME',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_DATE_TIME'
    },
    FILE_UPLOAD: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FILE_UPLOAD',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FILE_UPLOAD'
    },
    FREE_TEXT: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FREE_TEXT',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FREE_TEXT'
    },
    MARKUP: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MARKUP',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MARKUP'
    },
    MULTIPLE_OPTIONS: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MULTIPLE_ANSWERS',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MULTIPLE_ANSWERS'
    },
    NUMERIC: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_NUMERIC',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_NUMERIC'
    },
    SINGLE_SELECTION: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_SINGLE_ANSWER',
      value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_SINGLE_ANSWER'
    }
  };

  static ANSWERS_DISPLAY = {
    VERTICAL: {
      label: 'LNG_OUTBREAK_QUESTIONNAIRE_ANSWERS_DISPLAY_ORIENTATION_VERTICAL',
      value: 'LNG_OUTBREAK_QUESTIONNAIRE_ANSWERS_DISPLAY_ORIENTATION_VERTICAL'
    },
    HORIZONTAL: {
      label: 'LNG_OUTBREAK_QUESTIONNAIRE_ANSWERS_DISPLAY_ORIENTATION_HORIZONTAL',
      value: 'LNG_OUTBREAK_QUESTIONNAIRE_ANSWERS_DISPLAY_ORIENTATION_HORIZONTAL'
    }
  };

  // outbreak map servers
  static OUTBREAK_MAP_SERVER_TYPES = {
    TILE_TILE_ARC_GIS_REST: {
      label: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_TILE_ARC_GIS_REST',
      value: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_TILE_ARC_GIS_REST'
    },
    TILE_XYZ: {
      label: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_XYZ',
      value: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_XYZ'
    },
    VECTOR_TILE_VECTOR_TILE_LAYER: {
      label: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_VECTOR_TILE_VECTOR_TILE_LAYER',
      value: 'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_VECTOR_TILE_VECTOR_TILE_LAYER'
    }
  };

  static APP_PAGE = {
    LAB_RESULTS: {
      label: 'LNG_APP_PAGE_LAB_RESULTS',
      value: 'LNG_APP_PAGE_LAB_RESULTS'
    },
    CASE_LAB_RESULTS: {
      label: 'LNG_APP_PAGE_CASE_LAB_RESULTS',
      value: 'LNG_APP_PAGE_CASE_LAB_RESULTS'
    },
    CONTACT_LAB_RESULTS: {
      label: 'LNG_APP_PAGE_CONTACT_LAB_RESULTS',
      value: 'LNG_APP_PAGE_CONTACT_LAB_RESULTS'
    },
    AVAILABLE_ENTITIES_FOR_RELATIONSHIPS: {
      label: 'LNG_APP_PAGE_AVAILABLE_ENTITIES_FOR_RELATIONSHIPS',
      value: 'LNG_APP_PAGE_AVAILABLE_ENTITIES_FOR_RELATIONSHIPS'
    },
    AVAILABLE_ENTITIES_FOR_SWITCH: {
      label: 'LNG_APP_PAGE_AVAILABLE_ENTITIES_FOR_SWITCH',
      value: 'LNG_APP_PAGE_AVAILABLE_ENTITIES_FOR_SWITCH'
    },
    INDIVIDUAL_CONTACT_FOLLOW_UPS: {
      label: 'LNG_APP_PAGE_INDIVIDUAL_CONTACT_FOLLOW_UPS',
      value: 'LNG_APP_PAGE_INDIVIDUAL_CONTACT_FOLLOW_UPS'
    },
    DAILY_FOLLOW_UPS: {
      label: 'LNG_APP_PAGE_DAILY_FOLLOW_UPS',
      value: 'LNG_APP_PAGE_DAILY_FOLLOW_UPS'
    },
    PEOPLE_TO_SHARE_RELATIONSHIPS_WITH: {
      label: 'LNG_APP_PAGE_PEOPLE_TO_SHARE_RELATIONSHIPS_WITH',
      value: 'LNG_APP_PAGE_PEOPLE_TO_SHARE_RELATIONSHIPS_WITH'
    },
    CASES: {
      label: 'LNG_APP_PAGE_CASES',
      value: 'LNG_APP_PAGE_CASES'
    },
    CONTACTS: {
      label: 'LNG_APP_PAGE_CONTACTS',
      value: 'LNG_APP_PAGE_CONTACTS'
    },
    CONTACTS_OF_CONTACTS: {
      label: 'LNG_APP_PAGE_CONTACTS_OF_CONTACTS',
      value: 'LNG_APP_PAGE_CONTACTS_OF_CONTACTS'
    },
    EVENTS: {
      label: 'LNG_APP_PAGE_EVENTS',
      value: 'LNG_APP_PAGE_EVENTS'
    },
    OUTBREAKS: {
      label: 'LNG_APP_PAGE_OUTBREAKS',
      value: 'LNG_APP_PAGE_OUTBREAKS'
    },
    OUTBREAK_TEMPLATES: {
      label: 'LNG_APP_PAGE_OUTBREAK_TEMPLATES',
      value: 'LNG_APP_PAGE_OUTBREAK_TEMPLATES'
    },
    CLUSTERS: {
      label: 'LNG_APP_PAGE_CLUSTERS',
      value: 'LNG_APP_PAGE_CLUSTERS'
    },
    USERS: {
      label: 'LNG_APP_PAGE_USERS',
      value: 'LNG_APP_PAGE_USERS'
    },
    TEAM: {
      label: 'LNG_APP_PAGE_TEAMS',
      value: 'LNG_APP_PAGE_TEAMS'
    },
    ENTITY_NOT_DUPLICATES: {
      label: 'LNG_APP_PAGE_ENTITY_NOT_DUPLICATES',
      value: 'LNG_APP_PAGE_ENTITY_NOT_DUPLICATES'
    },
    ROLES: {
      label: 'LNG_APP_PAGE_ROLES',
      value: 'LNG_APP_PAGE_ROLES'
    },
    RELATIONSHIPS: {
      label: 'LNG_APP_PAGE_RELATIONSHIPS',
      value: 'LNG_APP_PAGE_RELATIONSHIPS'
    },
    COT_BAR_CHART: {
      label: 'LNG_APP_PAGE_COT_BAR_CHART',
      value: 'LNG_APP_PAGE_COT_BAR_CHART'
    },
    GANTT_CHART: {
      label: 'LNG_APP_PAGE_GANTT_CHART',
      value: 'LNG_APP_PAGE_GANTT_CHART'
    },
    DASHBOARD: {
      label: 'LNG_APP_PAGE_DASHBOARD',
      value: 'LNG_APP_PAGE_DASHBOARD'
    },
    COT_GRAPH: {
      label: 'LNG_APP_PAGE_COT_GRAPH',
      value: 'LNG_APP_PAGE_COT_GRAPH'
    },
    CASE_COUNT_MAP: {
      label: 'LNG_APP_PAGE_CASE_COUNT_MAP',
      value: 'LNG_APP_PAGE_CASE_COUNT_MAP'
    },
    FOLLOW_UP_DASHBOARD: {
      label: 'LNG_APP_PAGE_FOLLOW_UP_DASHBOARD',
      value: 'LNG_APP_PAGE_FOLLOW_UP_DASHBOARD'
    },
    TEAM_WORKLOAD: {
      label: 'LNG_APP_PAGE_TEAM_WORKLOAD',
      value: 'LNG_APP_PAGE_TEAM_WORKLOAD'
    },
    USER_WORKLOAD: {
      label: 'LNG_APP_PAGE_USER_WORKLOAD',
      value: 'LNG_APP_PAGE_USER_WORKLOAD'
    },
    HELP_SEARCH: {
      label: 'LNG_APP_PAGE_HELP_SEARCH',
      value: 'LNG_APP_PAGE_HELP_SEARCH'
    },
    SYSTEM_DEVICES: {
      label: 'LNG_APP_PAGE_SYSTEM_DEVICES',
      value: 'LNG_APP_PAGE_SYSTEM_DEVICES'
    }
  };

  static DEVICE_WIPE_STATUS = {
    READY: {
      label: 'LNG_DEVICE_WIPE_STATUS_READY',
      value: 'LNG_DEVICE_WIPE_STATUS_READY'
    },
    PENDING: {
      label: 'LNG_DEVICE_WIPE_STATUS_PENDING',
      value: 'LNG_DEVICE_WIPE_STATUS_PENDING'
    }
  };

  /**
     * Outbreak follow-up generation system
     */
  static FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM = {
    ROUND_ROBIN_ALL_TEAMS: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_ROUND_ROBIN_ALL_TEAMS',
      value: 'LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_ROUND_ROBIN_ALL_TEAMS'
    },
    ROUND_ROBIN_NEAREST_FIT: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_ROUND_ROBIN_NEAREST_FIT',
      value: 'LNG_REFERENCE_DATA_CATEGORY_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_ROUND_ROBIN_NEAREST_FIT'
    }
  };

  /**
     * FollowUp status
     */
  static FOLLOW_UP_STATUS = {
    NO_DATA : {
      label: 'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_PERFORMED',
      value: 'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_PERFORMED'
    }
  };

  /**
     * System settings backup modules
     */
  static SYSTEM_BACKUP_TYPES = {
    N_HOURS: {
      label: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE_N_HOURS',
      value: 'n_hours'
    },
    DAILY_AT_TIME: {
      label: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE_DAILY_AT_TIME',
      value: 'daily_at_time'
    }
  };

  /**
     * System settings backup modules
     */
  static SYSTEM_BACKUP_MODULES = {
    SYSTEM_CONFIGURATION: {
      label: 'LNG_BACKUP_MODULE_LABEL_SYSTEM_CONFIGURATION',
      value: 'System Configuration'
    },
    DATA: {
      label: 'LNG_BACKUP_MODULE_LABEL_SYSTEM_DATA',
      value: 'Data'
    }
  };

  /**
     * System settings backup status
     */
  static SYSTEM_BACKUP_STATUS = {
    SUCCESS: {
      label: 'LNG_BACKUP_STATUS_SUCCESS',
      value: 'LNG_BACKUP_STATUS_SUCCESS'
    },
    FAILED: {
      label: 'LNG_BACKUP_STATUS_FAILED',
      value: 'LNG_BACKUP_STATUS_FAILED'
    },
    PENDING: {
      label: 'LNG_BACKUP_STATUS_PENDING',
      value: 'LNG_BACKUP_STATUS_PENDING'
    }
  };

  /**
     *Pages that have import options
     */
  static APP_IMPORT_PAGE = {
    CASE: {
      label: 'LNG_APP_PAGE_IMPORT_CASES',
      value: 'LNG_APP_PAGE_IMPORT_CASES'
    },
    EVENT: {
      label: 'LNG_APP_PAGE_IMPORT_EVENT',
      value: 'LNG_APP_PAGE_IMPORT_EVENT'
    },
    CONTACT: {
      label: 'LNG_APP_PAGE_IMPORT_CONTACTS',
      value: 'LNG_APP_PAGE_IMPORT_CONTACTS'
    },
    CONTACT_OF_CONTACT: {
      label: 'LNG_APP_PAGE_IMPORT_CONTACTS_OF_CONTACTS',
      value: 'LNG_APP_PAGE_IMPORT_CONTACTS_OF_CONTACTS'
    },
    CASE_LAB_DATA: {
      label: 'LNG_APP_PAGE_IMPORT_CASE_LAB_DATA',
      value: 'LNG_APP_PAGE_IMPORT_CASE_LAB_DATA'
    },
    CONTACT_LAB_DATA: {
      label: 'LNG_APP_PAGE_IMPORT_CONTACT_LAB_DATA',
      value: 'LNG_APP_PAGE_IMPORT_CONTACT_LAB_DATA'
    },
    REFERENCE_DATA: {
      label: 'LNG_APP_PAGE_IMPORT_REFERENCE_DATA',
      value: 'LNG_APP_PAGE_IMPORT_REFERENCE_DATA'
    },
    LOCATION_DATA: {
      label: 'LNG_APP_PAGE_IMPORT_LOCATION_DATA',
      value: 'LNG_APP_PAGE_IMPORT_LOCATION_DATA'
    },
    RELATIONSHIP_DATA: {
      label: 'LNG_APP_PAGE_IMPORT_RELATIONSHIP_DATA',
      value: 'LNG_APP_PAGE_IMPORT_RELATIONSHIP_DATA'
    }
  };

  /**
     * System sync log status
     */
  static SYSTEM_SYNC_LOG_STATUS = {
    SUCCESS: {
      label: 'LNG_SYNC_STATUS_SUCCESS',
      value: 'LNG_SYNC_STATUS_SUCCESS'
    },
    SUCCESS_WITH_WARNINGS: {
      label: 'LNG_SYNC_STATUS_SUCCESS_WITH_WARNINGS',
      value: 'LNG_SYNC_STATUS_SUCCESS_WITH_WARNINGS'
    },
    FAILED: {
      label: 'LNG_SYNC_STATUS_FAILED',
      value: 'LNG_SYNC_STATUS_FAILED'
    },
    IN_PROGRESS: {
      label: 'LNG_SYNC_STATUS_IN_PROGRESS',
      value: 'LNG_SYNC_STATUS_IN_PROGRESS'
    }
  };

  // keep functionality
  static APPLY_LIST_FILTER = ApplyListFilter;

  // Options for Yes/No dropdowns
  static FILTER_YES_NO_OPTIONS = {
    ALL: {
      label: 'LNG_COMMON_LABEL_ALL',
      value: ''
    },
    YES: {
      label: 'LNG_COMMON_LABEL_YES',
      value: true
    },
    NO: {
      label: 'LNG_COMMON_LABEL_NO',
      value: false
    }
  };

  static PROGRESS_OPTIONS = {
    IN_PROGRESS: {
      label: 'LNG_PROGRESS_OPTION_LABEL_IN_PROGRESS',
      value: 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_STATUS_IN_PROGRESS'
    },
    COMPLETED: {
      label: 'LNG_PROGRESS_OPTION_LABEL_COMPLETED',
      value: 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_STATUS_COMPLETED'
    }
  };

  /**
     * Used to match suspect or confirmed cases in the logic ( ex: metrics )
     */
  static CASE_CLASSIFICATION = {
    SUSPECT: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_SUSPECT',
    CONFIRMED: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED',
    NOT_A_CASE: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_NOT_A_CASE_DISCARDED',
    PROBABLE: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_PROBABLE'
  };

  /**
     * Used to display icons for context of transmission
     */
  static CONTEXT_OF_TRANSMISSION = {
    CO_WORKERS: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_CO_WORKERS',
    FAMILY: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_FAMILY',
    FRIENDS: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_FRIENDS',
    FUNERAL: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_FUNERAL',
    NEIGHBOUR: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_NEIGHBOR',
    NOSOCOMIAL: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_NOSOCOMIAL_TRANSMISSION',
    TRAVEL: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_TRAVEL_TO_OUTBREAK_AREA',
    UNKNOWN: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION_UNKNOWN'
  };

  /**
     * Used to display icons for exposure type
     */
  static EXPOSURE_TYPE = {
    DIRECT_PHYSICAL_CONTACT: 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE_DIRECT_PHYSICAL_CONTACT',
    SLEPT_ATE_SPENT_TIME_TOGETHER: 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE_SLEPT_ATE_OR_SPEND_TIME_IN_SAME_HOUSEHOLD',
    TOUCHED_BODY_FLUIDS: 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE_TOUCHED_BODY_FLUIDS',
    TOUCHED_LINENS_CLOTHES: 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE_TOUCHED_OR_SHARED_LINENS_CLOTHES_DISHES'
  };

  /**
     * Used to match certainity level in the logic ( ex: chains of transmission )
     */
  static CERTAINITY_LEVEL = {
    LOW: 'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_1_LOW',
    MEDIUM: 'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_2_MEDIUM',
    HIGH: 'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL_3_HIGH'
  };

  /**
     * Used to determine action that we need to take when duplicates are detected ( create / modify - case / contact)
     */
  static DUPLICATE_ACTION = {
    NO_ACTION: 'LNG_DUPLICATES_DIALOG_ACTION_NONE',
    NOT_A_DUPLICATE: 'LNG_DUPLICATES_DIALOG_ACTION_MARK_AS_NOT_A_DUPLICATE',
    MERGE: 'LNG_DUPLICATES_DIALOG_ACTION_MERGE_DUPLICATE'
  };

  /**
     * Chronology item type
     */
  static CHRONOLOGY_ITEM_TYPE = {
    FOLLOW_UP: 'LNG_FOLLOW_UP_ITEM'
  };

  /**
     * Platform architecture
     */
  static PLATFORM_ARCH = {
    X64: 'x64',
    X86: 'x86'
  };

  /**
     * Use to match outcome status in the logic
     */
  static OUTCOME_STATUS = {
    DECEASED : 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_DECEASED',
    ALIVE : 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_ALIVE',
    RECOVERED : 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_RECOVERED'
  };

  //  transmission chain view types
  static TRANSMISSION_CHAIN_VIEW_TYPES = {
    BUBBLE_NETWORK: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_BUBBLE_NETWORK_VIEW',
      value: 'BUBBLE_NETWORK'
    },
    GEOSPATIAL_MAP: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_GEOSPATIAL_MAP',
      value: 'GEOSPATIAL_MAP'
    },
    HIERARCHICAL_NETWORK: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_HIERARCHICAL_NETWORK_VIEW',
      value: 'HIERARCHICAL_NETWORK'
    },
    TIMELINE_NETWORK: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TIMELINE_NETWORK_VIEW_DATE_OF_ONSET',
      value: 'TIMELINE_NETWORK'
    },
    TIMELINE_NETWORK_LAST_CONTACT: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TIMELINE_NETWORK_VIEW_DATE_OF_LAST_CONTACT',
      value: 'TIMELINE_NETWORK_LAST_CONTACT'
    },
    TIMELINE_NETWORK_REPORTING: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TIMELINE_NETWORK_VIEW_DATE_OF_REPORTING',
      value: 'TIMELINE_NETWORK_REPORTING'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS = {
    TYPE: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
      value: 'type'
    },
    CLASSIFICATION: {
      label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
      value: 'classification'
    },
    RISK_LEVEL: {
      label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
      value: 'riskLevel'
    },
    GENDER: {
      label: 'LNG_CASE_FIELD_LABEL_GENDER',
      value: 'gender'
    },
    OCCUPATION: {
      label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
      value: 'occupation'
    },
    OUTCOME: {
      label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
      value: 'outcomeId'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS = {
    NONE: {
      label: 'LNG_COMMON_LABEL_NONE',
      value: 'none'
    },
    CERTAINITY_LEVEL: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
      value: 'certaintyLevelId'
    },
    SOCIAL_RELATIONSHIP_TYPE: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
      value: 'socialRelationshipTypeId'
    },
    EXPOSURE_TYPE: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
      value: 'exposureTypeId'
    },
    EXPOSURE_FREQUENCY: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
      value: 'exposureFrequencyId'
    },
    EXPOSURE_DURATION: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
      value: 'exposureDurationId'
    },
    CLUSTER: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
      value: 'clusterId'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS = {
    NONE: {
      label: 'LNG_COMMON_LABEL_NONE',
      value: 'none'
    },
    DAYS_DAYE_ONSET_LAST_CONTACT: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_CHAINS_EDGE_LABEL_FILTER_DAYS_BETWEEN_ONSET_LAST_CONTACT',
      value: 'dateOnsetlastContact'
    },
    SOCIAL_RELATIONSHIP_TYPE: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION',
      value: 'socialRelationshipTypeId'
    },
    SOCIAL_RELATIONSHIP_LEVEL: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
      value: 'socialRelationshipDetail'
    },
    CLUSTER_NAME: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
      value: 'clusterId'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS = {
    NONE: {
      label: 'LNG_COMMON_LABEL_NONE',
      value: 'none'
    },
    SOCIAL_RELATIONSHIP_TYPE: {
      label: 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION',
      value: 'socialRelationshipTypeId'
    },
    EXPOSURE_TYPE: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
      value: 'exposureTypeId'
    },
    CLUSTER: {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
      value: 'clusterId'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS = {
    NONE: {
      label: 'LNG_COMMON_LABEL_NONE',
      value: 'none'
    },
    TYPE: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
      value: 'type'
    },
    CLASSIFICATION: {
      label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
      value: 'classification'
    },
    RISK_LEVEL: {
      label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
      value: 'riskLevel'
    },
    GENDER: {
      label: 'LNG_CASE_FIELD_LABEL_GENDER',
      value: 'gender'
    },
    OCCUPATION: {
      label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
      value: 'occupation'
    },
    OUTCOME: {
      label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
      value: 'outcomeId'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS = {
    NONE: {
      label: 'LNG_COMMON_LABEL_NONE',
      value: 'none'
    },
    TYPE: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
      value: 'type'
    },
    CLASSIFICATION: {
      label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
      value: 'classification'
    }
  };

  // used for the criteria radio buttons in the chains of transmission settings
  static TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS = {
    NAME: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_NAME',
      value: 'name'
    },
    AGE: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_AGE',
      value: 'age'
    },
    DATE_OF_ONSET_AND_EVENT_DATE: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_DATE_OF_ONSET_AND_EVENT_DATE',
      value: 'dateOfOnsetAndEventDate'
    },
    GENDER: {
      label: 'LNG_CASE_FIELD_LABEL_GENDER',
      value: 'gender'
    },
    LOCATION: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_LOCATION',
      value: 'location'
    },
    INITIALS: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_INITIALS',
      value: 'initials'
    },
    VISUAL_ID: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_VISUAL_ID',
      value: 'visual_id'
    },
    CONCATENATED_DETAILS: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_CONCATENATED_DETAILS',
      value: 'concatenated_details'
    },
    OCCUPATION: {
      label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
      value: 'occupation'
    },
    ID_AND_LOCATION: {
      label: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_VISUAL_ID_AND_LOCATION',
      value: 'visual_id_and_location'
    }
  };

  // audit log actions
  static AUDIT_LOG_ACTION_OPTIONS = {
    CREATED: {
      label: 'LNG_AUDIT_LOG_ACTIONS_CREATED',
      value: 'LNG_AUDIT_LOG_ACTIONS_CREATED'
    },
    MODIFIED: {
      label: 'LNG_AUDIT_LOG_ACTIONS_MODIFIED',
      value: 'LNG_AUDIT_LOG_ACTIONS_MODIFIED'
    },
    REMOVED: {
      label: 'LNG_AUDIT_LOG_ACTIONS_REMOVED',
      value: 'LNG_AUDIT_LOG_ACTIONS_REMOVED'
    },
    RESTORED: {
      label: 'LNG_AUDIT_LOG_ACTIONS_RESTORED',
      value: 'LNG_AUDIT_LOG_ACTIONS_RESTORED'
    }
  };

  // possible modules
  static DATA_MODULES = {
    USER: {
      label: 'LNG_MODULE_LABEL_USER',
      value: 'user'
    },
    ROLE: {
      label: 'LNG_MODULE_LABEL_ROLE',
      value: 'role'
    },
    LOCATION: {
      label: 'LNG_MODULE_LABEL_LOCATION',
      value: 'location'
    },
    TEAM: {
      label: 'LNG_MODULE_LABEL_TEAM',
      value: 'team'
    },
    AUDIT_LOG: {
      label: 'LNG_MODULE_LABEL_AUDIT_LOG',
      value: 'auditLog'
    },
    SYSTEM_SETTINGS: {
      label: 'LNG_MODULE_LABEL_SYSTEM_SETTINGS',
      value: 'systemSettings'
    },
    SYNC_LOG: {
      label: 'LNG_MODULE_LABEL_SYNC_LOG',
      value: 'syncLog'
    },
    DB_ACTION_LOG: {
      label: 'LNG_MODULE_LABEL_DATABASE_ACTION_LOG',
      value: 'databaseActionLog'
    },
    DB_EXPORT_LOG: {
      label: 'LNG_MODULE_LABEL_DATABASE_EXPORT_LOG',
      value: 'databaseExportLog'
    },
    TEMPLATE: {
      label: 'LNG_MODULE_LABEL_TEMPLATE',
      value: 'template'
    },
    OUTBREAK: {
      label: 'LNG_MODULE_LABEL_OUTBREAK',
      value: 'outbreak'
    },
    CASE: {
      label: 'LNG_MODULE_LABEL_CASE',
      value: 'case'
    },
    CONTACT: {
      label: 'LNG_MODULE_LABEL_CONTACT',
      value: 'contact'
    },
    REFERENCE_DATA: {
      label: 'LNG_MODULE_LABEL_REFERENCE_DATA',
      value: 'referenceData'
    },
    FOLLOW_UP: {
      label: 'LNG_MODULE_LABEL_FOLLOW_UP',
      value: 'followUp'
    },
    CLUSTER: {
      label: 'LNG_MODULE_LABEL_CLUSTER',
      value: 'cluster'
    },
    HELP_CATEGORY: {
      label: 'LNG_MODULE_LABEL_HELP_CATEGORY',
      value: 'helpCategory'
    },
    LAB_RESULT: {
      label: 'LNG_MODULE_LABEL_LAB_RESULT',
      value: 'labResult'
    },
    HELP_ITEM: {
      label: 'LNG_MODULE_LABEL_HELP_ITEM',
      value: 'helpItem'
    },
    RELATIONSHIP: {
      label: 'LNG_MODULE_LABEL_RELATIONSHIP',
      value: 'relationship'
    },
    ACCESS_TOKEN: {
      label: 'LNG_MODULE_LABEL_ACCESS_TOKEN',
      value: 'accessToken'
    },
    PERSON: {
      label: 'LNG_MODULE_LABEL_PERSON',
      value: 'person'
    },
    LANGUAGE: {
      label: 'LNG_MODULE_LABEL_LANGUAGE',
      value: 'language'
    },
    LANGUAGE_TOKEN: {
      label: 'LNG_MODULE_LABEL_LANGUAGE_TOKEN',
      value: 'languageToken'
    },
    EVENT: {
      label: 'LNG_MODULE_LABEL_EVENT',
      value: 'event'
    },
    ICON: {
      label: 'LNG_MODULE_LABEL_ICON',
      value: 'icon'
    },
    BACKUP: {
      label: 'LNG_MODULE_LABEL_BACKUP',
      value: 'backup'
    },
    FILE_ATTACHMENT: {
      label: 'LNG_MODULE_LABEL_FILE_ATTACHMENT',
      value: 'fileAttachment'
    }
  };

  // possible modules for export sync package
  static SYNC_PACKAGE_EXPORT_MODULES = {
    CLUSTER: {
      label: 'LNG_MODULE_LABEL_CLUSTER',
      value: 'cluster'
    },
    FOLLOW_UP: {
      label: 'LNG_MODULE_LABEL_FOLLOW_UP',
      value: 'followUp'
    },
    LAB_RESULT: {
      label: 'LNG_MODULE_LABEL_LAB_RESULT',
      value: 'labResult'
    },
    LANGUAGE: {
      label: 'LNG_MODULE_LABEL_LANGUAGE',
      value: 'language'
    },
    LANGUAGE_TOKEN: {
      label: 'LNG_MODULE_LABEL_LANGUAGE_TOKEN',
      value: 'languageToken'
    },
    LOCATION: {
      label: 'LNG_MODULE_LABEL_LOCATION',
      value: 'location'
    },
    OUTBREAK: {
      label: 'LNG_MODULE_LABEL_OUTBREAK',
      value: 'outbreak'
    },
    PERSON: {
      label: 'LNG_MODULE_LABEL_PERSON',
      value: 'person'
    },
    REFERENCE_DATA: {
      label: 'LNG_MODULE_LABEL_REFERENCE_DATA',
      value: 'referenceData'
    },
    RELATIONSHIP: {
      label: 'LNG_MODULE_LABEL_RELATIONSHIP',
      value: 'relationship'
    },
    ROLE: {
      label: 'LNG_MODULE_LABEL_ROLE',
      value: 'role'
    },
    TEAM: {
      label: 'LNG_MODULE_LABEL_TEAM',
      value: 'team'
    },
    USER: {
      label: 'LNG_MODULE_LABEL_USER',
      value: 'user'
    },
    SYSTEM_SETTINGS: {
      label: 'LNG_MODULE_LABEL_SYSTEM_SETTINGS',
      value: 'systemSettings'
    },
    TEMPLATE: {
      label: 'LNG_MODULE_LABEL_TEMPLATE',
      value: 'template'
    },
    ICON: {
      label: 'LNG_MODULE_LABEL_ICON',
      value: 'icon'
    },
    HELP_CATEGORY: {
      label: 'LNG_MODULE_LABEL_HELP_CATEGORY',
      value: 'helpCategory'
    },
    HELP_ITEM: {
      label: 'LNG_MODULE_LABEL_HELP_ITEM',
      value: 'helpItem'
    },
    AUDIT_LOG: {
      label: 'LNG_MODULE_LABEL_AUDIT_LOG',
      value: 'auditLog'
    },
    FILE_ATTACHMENT: {
      label: 'LNG_MODULE_LABEL_FILE_ATTACHMENT',
      value: 'fileAttachment'
    },
    DEVICE: {
      label: 'LNG_MODULE_LABEL_DEVICE',
      value: 'device'
    },
    DEVICE_HISTORY: {
      label: 'LNG_MODULE_LABEL_DEVICE_HISTORY',
      value: 'deviceHistory'
    }
  };

  // possible export types for export sync package
  static SYNC_PACKAGE_EXPORT_TYPES = {
    MOBILE: {
      label: 'LNG_SYNC_PACKAGE_EXPORT_TYPE_FIELD_LABEL_MOBILE',
      value: 'mobile'
    },
    SYSTEM: {
      label: 'LNG_SYNC_PACKAGE_EXPORT_TYPE_FIELD_LABEL_SYSTEM',
      value: 'system'
    },
    OUTBREAK: {
      label: 'LNG_SYNC_PACKAGE_EXPORT_TYPE_FIELD_LABEL_OUTBREAK',
      value: 'outbreak'
    },
    FULL: {
      label: 'LNG_SYNC_PACKAGE_EXPORT_TYPE_FIELD_LABEL_FULL',
      value: 'full'
    }
  };


  static EPI_CURVE_VIEW_TYPE = {
    DAY: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_SHOW_DAYS_LABEL',
      value: 'day'
    },
    WEEK: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_SHOW_WEEKS_LABEL',
      value: 'week'
    },
    MONTH: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_SHOW_MONTHS_LABEL',
      value: 'month'
    }
  };

  static EPI_CURVE_WEEK_TYPES = {
    ISO: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_WEEK_TYPE_ISO',
      value: 'iso'
    },
    EPI: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_WEEK_TYPE_EPI',
      value: 'epi'
    },
    SUNDAY: {
      label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_WEEK_TYPE_SUNDAY',
      value: 'sunday'
    }
  };

  static GANTT_CHART_VIEW_TYPE = {
    DAY: {
      label: 'LNG_PAGE_DASHBOARD_GANTT_CHART_SHOW_DAYS_LABEL',
      value: 'day'
    },
    MONTH: {
      label: 'LNG_PAGE_DASHBOARD_GANTT_CHART_SHOW_MONTHS_LABEL',
      value: 'month'
    },
    WEEK: {
      label: 'LNG_PAGE_DASHBOARD_GANTT_CHART_SHOW_WEEKS_LABEL',
      value: 'week'
    }
  };

  static RANGE_FOLLOW_UP_EXPORT_GROUP_BY = {
    PLACE: {
      label: 'LNG_RANGE_FOLLOW_UP_FIELD_EXPORT_GROUP_BY_PLACE',
      value: 'place'
    },
    CASE: {
      label: 'LNG_RANGE_FOLLOW_UP_FIELD_EXPORT_GROUP_BY_CASE',
      value: 'case'
    },
    RISK: {
      label: 'LNG_RANGE_FOLLOW_UP_FIELD_EXPORT_GROUP_BY_RISK',
      value: 'riskLevel'
    }
  };

  //  gantt chart types
  static GANTT_CHART_TYPES = {
    GANTT_CHART_LAB_TEST: {
      label: 'LNG_PAGE_GANTT_CHART_LAB_TEST_TITLE',
      value: 'GANTT_CHART_LAB_TEST'
    },
    GANTT_CHART_HOSPITALIZATION_ISOLATION: {
      label: 'LNG_PAGE_GANTT_CHART_HOSPITALIZATION_ISOLATION_TITLE',
      value: 'GANTT_CHART_HOSPITALIZATION_ISOLATION'
    }
  };

  // cot snapshot statuses
  static COT_SNAPSHOT_STATUSES = {
    LNG_COT_STATUS_SUCCESS: {
      label: 'LNG_COT_STATUS_SUCCESS',
      value: 'LNG_COT_STATUS_SUCCESS'
    },
    LNG_COT_STATUS_FAILED: {
      label: 'LNG_COT_STATUS_FAILED',
      value: 'LNG_COT_STATUS_FAILED'
    },
    LNG_COT_STATUS_IN_PROGRESS: {
      label: 'LNG_COT_STATUS_IN_PROGRESS',
      value: 'LNG_COT_STATUS_IN_PROGRESS'
    }
  };

  // export groups
  static EXPORT_GROUP = {
    RELATIONSHIPS_DATA: 'LNG_COMMON_LABEL_EXPORT_GROUP_RELATIONSHIPS_DATA'
  };

  /**
     * Today date
     */
  static getCurrentDate(): Moment {
    return moment().startOf('day');
  }

  /**
     * Check if a given date is in the future
     */
  static isDateInTheFuture(date): boolean {
    const dateMoment = date ? moment(date) : null;
    return !!(dateMoment && dateMoment.startOf('day').isAfter(Constants.getCurrentDate()));
  }

  /**
     * Generate random string
     * @param alphabet
     */
  static randomString(
    length: number,
    alphabet: string = Constants.DEFAULT_RANDOM_ALPHABET
  ): string {
    // generate string
    let result: string = '';
    while (result.length < length) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    // finished
    return result;
  }

  /**
   * Determine color depending of base color luminosity
   */
  static hexColorToTextColor(color: string): string {
    // determine text color from bg-color
    let textColor: string = color;
    if (textColor.length === 4) {
      textColor = textColor.substring(0, 1) +
        textColor.substring(1, 2) +
        textColor.substring(1, 2) +
        textColor.substring(2, 3) +
        textColor.substring(2, 3) +
        textColor.substring(3, 4) +
        textColor.substring(3, 4);
    }

    // determine lightness
    textColor = textColor.substring(1);
    const rgb: number = parseInt(textColor, 16);
    // eslint-disable-next-line no-bitwise
    const r: number = (rgb >> 16) & 0xff;
    // eslint-disable-next-line no-bitwise
    const g: number = (rgb >>  8) & 0xff;
    // eslint-disable-next-line no-bitwise
    const b: number = (rgb >>  0) & 0xff;

    // per ITU-R BT.709
    const luma: number = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return (luma / 255.0) > 0.4 ?
      '#333' :
      '#FFF';
  }
}
