export class Constants {
    // default display constants
    static DEFAULT_DATE_DISPLAY_FORMAT = 'MM/DD/YYYY';

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
        CASES_LESS_CONTACTS: 'cases_less_contacts',
        CONTACTS_LOST_TO_FOLLOW_UP: 'contacts_lost_to_follow_up'
    };

    static LIST_FILTER_TITLE = {
        [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST]: 'LNG_PAGE_LIST_FILTER_CONTACTS_ON_THE_FOLLOW_UP_LIST',
        [Constants.APPLY_LIST_FILTER.CASES_DECEASED]: 'LNG_PAGE_LIST_FILTER_CASES_DECEASED',
        [Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED]: 'LNG_PAGE_LIST_FILTER_CASES_HOSPITALISED',
        [Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_LESS_CONTACTS',
        [Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_LOST_TO_FOLLOW_UP'
    };

    // #TODO replace with Reference Data
    // #TODO add the whole list of countries
    static COUNTRY = {
        ALGERIA: {
            label: 'Algeria',
            value: 'Algeria'
        },
        CAMEROON: {
            label: 'Cameroon',
            value: 'Cameroon'
        },
        CONGO: {
            label: 'Congo',
            value: 'Congo'
        },
        ETHIOPIA: {
            label: 'Ethiopia',
            value: 'Ethiopia'
        },
        MADAGASCAR: {
            label: 'Madagascar',
            value: 'Madagascar'
        },
        NIGERIA: {
            label: 'Nigeria',
            value: 'Nigeria'
        },
        UGANDA: {
            label: 'Uganda',
            value: 'Uganda'
        },
        SUDAN: {
            label: 'Sudan',
            value: 'Sudan'
        }
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
            value: 'inProgress'
        },
        COMPLETED: {
            label: 'LNG_PROGRESS_OPTION_LABEL_COMPLETED',
            value: 'completed'
        }
    };
}
