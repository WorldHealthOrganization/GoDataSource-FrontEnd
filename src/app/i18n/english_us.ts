// tslint:disable:max-line-length
export const EnglishUsLang = {
    id: 'english_us',
    tokens: {
        /**
         * IMPORTANT: All the tokens must belong to a group mentioned in a comment like this one
         * IMPORTANT: The group must be mentioned with space separator ("Example group") or in camelCase format ("exampleGroup")
         */

        /**
         * Example group
         */
        // 'LNG_EXAMPLE_TOKEN': 'Example value'

        /**
         * uiDashboardPage
         */
        'LNG_PAGE_DASHBOARD_KPIS_ELEMENTS_NOT_VISIBLE_ERROR_MSG': 'Please make sure that at least one KPI dashlet is visible',

        /**
         * uiFollowUpFields
         */
        'LNG_FOLLOW_UP_FIELD_LABEL_CASE' : 'Case:',
        'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL': 'Email',

        /**
         * uiModifyFollowUpPage
         */
        'LNG_PAGE_MODIFY_FOLLOW_UP_FIELD_LABEL_FOLLOW_UP_WITH_INFO': '* This person is now a case and follow-up was performed at the time when \'{{ personName }}\' was registered as a contact"',

        /**
         * uiCaseFields
         */
        'LNG_CASE_FIELD_LABEL_EMAIL': 'Email',

        /**
         * uiContactFields
         */
        'LNG_CONTACT_FIELD_LABEL_EMAIL': 'Email',

        /**
         * uiEventFields
         */
        'LNG_EVENT_FIELD_LABEL_EMAIL': 'Email',

        /**
         * uiCommonFields
         */
        'LNG_COMMON_FIELD_LABEL_CODE': 'Code',

        /**
         * uiLoginPage
         */
        'LNG_PAGE_LOGIN_ACTION_LOGIN_2FA_CODE_REQUIRED': 'The code was sent to the following email "{{email}}"',

        /**
         * uiAPIErrors
         */
        'LNG_API_ERROR_CODE_AUTHORIZATION_REQUIRED': 'Login failed',

        /**
         * uiEntityFields
         */
        'LNG_ENTITY_FIELD_LABEL_NO_VACCINE': 'No vaccines',

        /**
         * uiUserFields
         */
        'LNG_USER_FIELD_LABEL_TEAMS': 'Teams',

        /**
         * uiImportData
         */
        'LNG_PAGE_IMPORT_DATA_BUTTON_MODIFY': 'Modify',
        'LNG_PAGE_IMPORT_DATA_BUTTON_CLONE': 'Clone',
        'LNG_PAGE_IMPORT_DATA_BUTTON_REMOVE': 'Remove',
        'LNG_PAGE_IMPORT_DATA_BUTTON_CLOSE_MODIFY': 'Hide modify',
        'LNG_PAGE_IMPORT_DATA_BUTTON_EXPAND_OPTIONS': 'Show sub-options',
        'LNG_PAGE_IMPORT_DATA_BUTTON_COLLAPSE_OPTIONS': 'Hide sub-options',
        'LNG_PAGE_IMPORT_DATA_BUTTON_MAP_SUB_OPTIONS': 'Map sub-options',
        'LNG_PAGE_IMPORT_DATA_REQUIRED': 'Field required',
        'LNG_PAGE_IMPORT_DATA_LABEL_ARRAY_INDEX': 'Level',
        'LNG_PAGE_IMPORT_DATA_LABEL_ARRAY_INDEX_DESCRIPTION': 'When Go.Data stores multiple records for the same type of data – for example a case that has three addresses, then you can choose the ‘level’ here.  For example, if you have two addresses in your source file for the same case then you can import one as Level 1 and the second as Level 2 to create the two addresses within the system.',
        'LNG_PAGE_IMPORT_DATA_INVALID_ARRAY_INDEX': 'Invalid indexes',
        'LNG_PAGE_IMPORT_DATA_RETRIEVING_UNIQUE_VALUES': 'Retrieving unique values',
        'LNG_PAGE_IMPORT_DATA_RETRIEVING_LOCATIONS': 'Retrieving locations',
        'LNG_PAGE_IMPORT_DATA_POPULATING_DISTINCT_CACHE': '{{index}} / {{total}}: Cache "{{key}}"',
        'LNG_PAGE_IMPORT_DATA_MAPPING_RETRIEVING_LOCATIONS': '{{index}} / {{total}}: Retrieving locations',
        'LNG_PAGE_IMPORT_DATA_MAPPING_RETRIEVING_RELABEL_LOCATIONS': 'Preparing locations cache',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS': 'Mapping',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_DESCRIPTION': 'Pending: must "Map sub-options" - Complete no / total: "total" is the number of distinct values from the file, while "no" is the number of mapped sub-options, this information is useful if you decide not to map everything, or to make sure you don\'t missing something - Complete: all file options are mapped - Incomplete no / total: "total" is the number of mapped sub-options while "no" is the number of invalid options - Handled above: it means that there are similar mappings above that if handled it will suffice - Completed above: Same as completed, but to see / change options you need to go above to the similar map',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_WAITING': 'Pending',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_WAITING_DESCRIPTION': 'You need to map sub-options',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_INVALID': 'Incomplete',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_INVALID_WITH_NO': 'Incomplete {{no}} / {{total}}',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_INVALID_HANDLED_ABOVE': 'Handled above',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_VALID': 'Complete',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_VALID_ABOVE': 'Completed above',
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_VALID_WITH_NO': 'Complete {{no}} / {{total}}',
        'LNG_PAGE_IMPORT_DATA_LABEL_RETRIEVE_MAP_DATA': 'Retrieving map data',
        'LNG_PAGE_IMPORT_DATA_MAPPING_DATA': '{{index}} / {{total}}: Mapping "{{key}}"',
        'LNG_PAGE_IMPORT_DATA_MAPPING_FINISHED': 'Mapping of sub-options finished. Please check that all of them were mapped properly.',
        'LNG_PAGE_IMPORT_DATA_LABEL_ROW_NO': 'No',
        'LNG_PAGE_IMPORT_DATA_ERROR_INVALID_ROWS': 'Invalid records: {{rows}}',
        'LNG_PAGE_IMPORT_DATA_LOAD_SAVED_MAPPING_CONFIRMATION': 'Are you sure you want to load "{{name}}"? It might take a while...',
        'LNG_PAGE_IMPORT_DATA_MIGHT_TAKE_SOME_TIME_MSG': 'Please be patient, it might take a couple of minutes to process data',

        /**
         * uiClustersListPage
         */
        'LNG_PAGE_LIST_CLUSTERS_MANAGE_ICONS_BUTTON': 'Manage icons',

        /**
         * uiClusterFields
         */
        'LNG_CLUSTER_FIELD_LABEL_COLOR': 'Colour',
        'LNG_CLUSTER_FIELD_LABEL_COLOR_DESCRIPTION': '',
        'LNG_CLUSTER_FIELD_LABEL_ICON': 'Icon',
        'LNG_CLUSTER_FIELD_LABEL_ICON_DESCRIPTION': '',

        /**
         * uiCreateClusterPage
         */
        'LNG_PAGE_CREATE_CLUSTER_LABEL_NO_ICON': 'No icon',

        /**
         * uiViewModifyClusterPage
         */
        'LNG_PAGE_MODIFY_CLUSTER_LABEL_NO_ICON': 'No icon',

        /**
         * uiClustersListPage
         */
        'LNG_PAGE_LIST_CLUSTERS_LABEL_NO_ICON': 'No icon',
        'LNG_PAGE_LIST_CLUSTERS_LABEL_NO_COLOR': 'No colour'



        /**
         * REMOVE the tokens from below
         */
        // LNG_PAGE_IMPORT_DATA_BUTTON_RESET_IMPORT_MAPPING
    }
};
