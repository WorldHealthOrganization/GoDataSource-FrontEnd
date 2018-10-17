import * as moment from 'moment';
import { Moment } from 'moment';

/**
 * Apply List Filter
 */
export enum ApplyListFilter {
    CONTACTS_FOLLOWUP_LIST = 'contacts_followup_list',
    CASES_DECEASED = 'cases_deceased',
    CASES_HOSPITALISED = 'cases_hospitalised',
    CONTACTS_LOST_TO_FOLLOW_UP = 'contacts_lost_to_follow_up',
    CONTACTS_NOT_SEEN = 'contacts_not_seen',
    CONTACTS_SEEN = 'contacts_seen',
    CONTACTS_FOLLOWED_UP = 'contacts_followed_up',
    CASES_LESS_CONTACTS = 'cases_less_contacts',
    CASES_IN_KNOWN_TRANSMISSION_CHAINS = 'cases_in_known_transmission_chains',
    CASES_PREVIOUS_DAYS_CONTACTS = 'cases_previous_days_contacts',
    CASES_PENDING_LAB_RESULT = 'cases_pending_lab_result',
    CASES_REFUSING_TREATMENT = 'cases_refusing_treatment',
    CONTACTS_BECOME_CASES = 'contacts_become_cases',
    NO_OF_ACTIVE_TRANSMISSION_CHAINS = 'number_of_active_chains',
    NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES = 'no_of_new_chains_of_transmission_from_contacts_who_become_cases',
    CASES_WITHOUT_RELATIONSHIPS  = 'cases_without_relationships',
    EVENTS_WITHOUT_RELATIONSHIPS  = 'events_without_relationships',
    CASES_WITHOUT_DATE_OF_ONSET_CHAIN = 'cases_without_date_of_onset_chain',
    CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN = 'contacts_without_date_of_last_contact_chain',
    EVENTS_WITHOUT_DATE_CHAIN = 'events_without_date_chain'
}

export class Constants {
    // default display constants
    static DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';
    static DEFAULT_DATE_TIME_DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

    // default configurations
    static DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS = 500;
    static DEFAULT_FILTER_POOLING_MS_CHECK_AGAIN = 2000; // 2 seconds ?

    // pagination defaults and configuration
    static PAGE_SIZE_OPTIONS = [10, 25, 50];
    static DEFAULT_PAGE_SIZE = 25;
    static DEFAULT_USAGE_MAX_RECORDS_DISPLAYED = 10;

    // AGE constants
    static DEFAULT_AGE_MAX_YEARS = 150;

    // default color used by reference data
    static DEFAULT_COLOR_REF_DATA = '#CCC';

    // default color to be used in chains of transmission
    static DEFAULT_COLOR_CHAINS = '#A8A8A8';

    // address constants - mapped to reference tokens
    static ADDRESS_USUAL_PLACE_OF_RESIDENCE = 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE_USUAL_PLACE_OF_RESIDENCE';

    // these need to be hardcoded, this is why we don't pull them from reference data
    // they are in reference data only to disable some options or translate labels ( since answer type category is readonly )
    static ANSWER_TYPES = {
        FREE_TEXT: {
            label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FREE_TEXT',
            value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FREE_TEXT'
        },
        MULTIPLE_OPTIONS: {
            label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MULTIPLE_ANSWERS',
            value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_MULTIPLE_ANSWERS'
        },
        SINGLE_SELECTION: {
            label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_SINGLE_ANSWER',
            value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_SINGLE_ANSWER'
        }
        // NUMERIC: {
        //     label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_NUMERIC',
        //     value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_NUMERIC'
        // },
        // FILE_UPLOAD: {
        //     label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FILE_UPLOAD',
        //     value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_FILE_UPLOAD'
        // },
        // DATE_TIME: {
        //     label: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_DATE_TIME',
        //     value: 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE_DATE_TIME'
        // }
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

    // list breadcrumbs
    static LIST_FILTER_TITLE = {
        [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST]: 'LNG_PAGE_LIST_FILTER_CONTACTS_ON_THE_FOLLOW_UP_LIST',
        [Constants.APPLY_LIST_FILTER.CASES_DECEASED]: 'LNG_PAGE_LIST_FILTER_CASES_DECEASED',
        [Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED]: 'LNG_PAGE_LIST_FILTER_CASES_HOSPITALISED',
        [Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_LESS_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_LOST_TO_FOLLOW_UP',
        [Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_NOT_SEEN',
        [Constants.APPLY_LIST_FILTER.CONTACTS_SEEN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_SEEN',
        [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_FOLLOWED_UP',
        [Constants.APPLY_LIST_FILTER.CASES_IN_KNOWN_TRANSMISSION_CHAINS]: 'LNG_PAGE_LIST_FILTER_CASES_KNOWN_TRANSMISSION_CHAINS',
        [Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_AMONG_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT]: 'LNG_PAGE_LIST_FILTER_CASES_PENDING_LAB_RESULT',
        [Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT]: 'LNG_PAGE_LIST_FILTER_CASES_REFUSING_TREATMENT',
        [Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NUMBER_OF_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE',
        [Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS]: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NUMBER_ACTIVE_CHAINS',
        [Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES',
        [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_CASES_WITHOUT_RELATIONSHIPS',
        [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_EVENTS_WITHOUT_RELATIONSHIPS',
        [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN]: 'LNG_PAGE_LIST_FILTER_CASES_WITHOUT_DATE_OF_ONSET_CHAIN',
        [Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN',
        [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN]: 'LNG_PAGE_LIST_FILTER_EVENTS_WITHOUT_DATE_CHAIN'
    };

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
        CONFIRMED: 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED'
    };

    //  transmission chain view types
    static TRANSMISSION_CHAIN_VIEW_TYPES = {
        BUBBLE_NETWORK: {
            label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_BUBBLE_NETWORK_VIEW',
            value: 'BUBBLE_NETWORK'
        },
        HIERARCHICAL_NETWORK: {
            label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_HIERARCHICAL_NETWORK_VIEW',
            value: 'HIERARCHICAL_NETWORK'
        },
        TIMELINE_NETWORK: {
            label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_TIMELINE_NETWORK_VIEW',
            value: 'TIMELINE_NETWORK'
        }
    };

    static TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS = {
        TYPE: {
            label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
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
        }
    };

    static TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS = {
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
        }
    };

    static TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS = {
        NONE: {
            label: 'LNG_COMMON_LABEL_NONE',
            value: 'none'
        },
        TYPE: {
            label: 'LNG_PAGE_DASHBOARD_CHAINS_OF_TRANSMISSION_ENTITY_TYPE_LABEL',
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
        }
    };

    /**
     * Today date
     */
    static getCurrentDate(): Moment {
        return moment().startOf('day');
    }

}
