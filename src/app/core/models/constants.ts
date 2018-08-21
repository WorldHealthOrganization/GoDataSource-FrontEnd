import * as moment from 'moment';

export class Constants {
    // default display constants
    static DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';

    // default configurations
    static DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS = 500;

    // #TODO replace with Reference Data
    static QUESTION_CATEGORIES = {
        PHYSICAL_EXAMINATION: {
            label: 'Physical Examination',
            value: 'Physical Examination'
        },
        CLINICAL: {
            label: 'Clinical',
            value: 'Clinical'
        }
    };

    static ANSWER_TYPES = {
        FREE_TEXT: {
            label: 'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_FREE_TEXT',
            value: 'Free text'
        },
        MULTIPLE_OPTIONS: {
            label: 'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_MULTIPLE_OPTIONS',
            value: 'Multiple Options'
        },
        SINGLE_SELECTION: {
            label: 'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_SINGLE_SELECTION',
            value: 'Single Selection'
        }

    };

    static APPLY_LIST_FILTER = {
        CONTACTS_FOLLOWUP_LIST: 'contacts_followup_list',
        CASES_DECEASED: 'cases_deceased',
        CASES_HOSPITALISED: 'cases_hospitalised',
        CONTACTS_LOST_TO_FOLLOW_UP: 'contacts_lost_to_follow_up',
        CONTACTS_NOT_SEEN: 'contacts_not_seen',
        CASES_LESS_CONTACTS: 'cases_less_contacts',
        CASES_IN_KNOWN_TRANSMISSION_CHAINS: 'cases_in_known_transmission_chains',
        CASES_PREVIOUS_DAYS_CONTACTS: 'cases_previous_days_contacts',
        CASES_PENDING_LAB_RESULT: 'cases_pending_lab_result',
        CASES_REFUSING_TREATMENT: 'cases_refusing_treatment',
        CONTACTS_BECOME_CASES: 'contacts_become_cases',
        NO_OF_ACTIVE_TRANSMISSION_CHAINS: 'number_of_active_chains'
    };

    static LIST_FILTER_TITLE = {
        [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST]: 'LNG_PAGE_LIST_FILTER_CONTACTS_ON_THE_FOLLOW_UP_LIST',
        [Constants.APPLY_LIST_FILTER.CASES_DECEASED]: 'LNG_PAGE_LIST_FILTER_CASES_DECEASED',
        [Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED]: 'LNG_PAGE_LIST_FILTER_CASES_HOSPITALISED',
        [Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_LESS_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_LOST_TO_FOLLOW_UP',
        [Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_NOT_SEEN',
        [Constants.APPLY_LIST_FILTER.CASES_IN_KNOWN_TRANSMISSION_CHAINS]: 'LNG_PAGE_LIST_FILTER_CASES_KNOWN_TRANSMISSION_CHAINS',
        [Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_AMONG_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT]: 'LNG_PAGE_LIST_FILTER_CASES_PENDING_LAB_RESULT',
        [Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT]: 'LNG_PAGE_LIST_FILTER_CASES_REFUSING_TREATMENT',
        [Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NUMBER_OF_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE',
        [Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS]: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NUMBER_ACTIVE_CHAINS'
    };

    // Gender
    static GENDER = {
        MALE: {
            label: 'Male',
            value: 'Male'
        },
        FEMALE: {
            label: 'Female',
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
