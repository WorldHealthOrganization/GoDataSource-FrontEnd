import * as moment from 'moment';

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
    CASES_LESS_CONTACTS = 'cases_less_contacts',
    CASES_IN_KNOWN_TRANSMISSION_CHAINS = 'cases_in_known_transmission_chains',
    CASES_PREVIOUS_DAYS_CONTACTS = 'cases_previous_days_contacts',
    CASES_PENDING_LAB_RESULT = 'cases_pending_lab_result',
    CASES_REFUSING_TREATMENT = 'cases_refusing_treatment',
    CONTACTS_BECOME_CASES = 'contacts_become_cases',
    NO_OF_ACTIVE_TRANSMISSION_CHAINS = 'number_of_active_chains',
    NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES = 'no_of_new_chains_of_transmission_from_contacts_who_become_cases',
    CASES_WITHOUT_RELATIONSHIPS  = 'cases_without_relationships',
    EVENTS_WITHOUT_RELATIONSHIPS  = 'events_without_relationships'
}

export class Constants {
    // default display constants
    static DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';

    // default configurations
    static DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS = 500;

    // pagination defaults and configuration
    static PAGE_SIZE_OPTIONS = [10, 25, 50];
    static DEFAULT_PAGE_SIZE = 25;

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
        [Constants.APPLY_LIST_FILTER.CASES_IN_KNOWN_TRANSMISSION_CHAINS]: 'LNG_PAGE_LIST_FILTER_CASES_KNOWN_TRANSMISSION_CHAINS',
        [Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_AMONG_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT]: 'LNG_PAGE_LIST_FILTER_CASES_PENDING_LAB_RESULT',
        [Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT]: 'LNG_PAGE_LIST_FILTER_CASES_REFUSING_TREATMENT',
        [Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NUMBER_OF_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE',
        [Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS]: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NUMBER_ACTIVE_CHAINS',
        [Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES',
        [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_CASES_WITHOUT_RELATIONSHIPS',
        [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_EVENTS_WITHOUT_RELATIONSHIPS'
    };

    // Gender
    static GENDER = {
        MALE: {
            label: 'LNG_COMMON_GENDER_MALE',
            value: 'Male'
        },
        FEMALE: {
            label: 'LNG_COMMON_GENDER_FEMALE',
            value: 'Female'
        }
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

    /**
     * Returns today's date
     * @returns Moment
     */
    static today() {
        return moment().startOf('day');
    }

}
