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
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_DESCRIPTION': `
            <div style="padding-bottom: 10px">
                <span style="color: #770000; font-weight: bold;">
                    Pending:
                </span>
                <span>
                    this field has not been completely loaded and mapped yet (please click on the "Map sub-options" button)
                </span>
            </div>
            <div style="padding-bottom: 10px">
                <span style="font-weight: bold;">
                    Complete no / total:
                </span>
                <span>
                    the number of values that have been mapped out of the total number of distinct values in the input file, this information is useful if you decide not to map everything, or to check that nothing is missed
                </span>
            </div>
            <div style="padding-bottom: 10px">
                <span style="font-weight: bold;">
                    Complete:
                </span>
                <span>
                    all file options are mapped and ready for import
                </span>
            </div>
            <div style="padding-bottom: 10px">
                <span style="color: #770000; font-weight: bold;">
                    Incomplete no / total:
                </span>
                <span>
                    the number of invalid values that are present out of the total number of distinct mapped values in the input file
                </span>
            </div>
            <div style="padding-bottom: 10px">
                <span style="color: #770000; font-weight: bold;">
                    Handled above:
                </span>
                <span>
                    a mapping already provided to the system for another field in this import is applicable here also and has been reused
                </span>
            </div>
            <div style="padding-bottom: 10px">
                <span style="font-weight: bold;">
                    Completed above:
                </span>
                <span>
                    a mapping already provided to the system for another field in this import is applicable here also and has been reused globally for all valid fields
                </span>
            </div>
        `,
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
        'LNG_PAGE_IMPORT_DATA_ERROR_MUST_FIX_DUPLICATE_BEFORE_ADD': 'Please fix "duplicate" issue before adding new sub-options',
        'LNG_PAGE_IMPORT_DATA_LOAD_SAVED_MAPPING_CONFIRMATION': 'Are you sure you want to load "{{name}}"? It might take a while...',
        'LNG_PAGE_IMPORT_DATA_MIGHT_TAKE_SOME_TIME_MSG': 'The file was successfully uploaded. Please be patient, it might take a couple of minutes to process data',
        'LNG_PAGE_IMPORT_DATA_VISIBLE_ITEMS_MSG': 'Rows {{no}}/{{total}}',
        'LNG_PAGE_IMPORT_DATA_IMPORTING_VALIDATING': 'Validate data',
        'LNG_PAGE_IMPORT_DATA_IMPORTING_PREPARE': 'Preparing data',
        'LNG_PAGE_IMPORT_DATA_IMPORTING_START_IMPORT': 'Starting import',
        'LNG_PAGE_IMPORT_DATA_IMPORTING_IMPORT_STATUS': 'Processed {{processed}} / {{total}} (failed: {{failed}})',
        'LNG_PAGE_IMPORT_DATA_ERROR_MISSING_ERROR_DETAILS': 'Something went wrong with the import, missing error details. Please check API logs',
        'LNG_PAGE_IMPORT_DATA_ERROR_PROCESSED_DETAILS': 'Processed records: {{processed.no}} / {{processed.total}}, imported: {{imported.success}}, failed: {{imported.failed}}',
        'LNG_PAGE_IMPORT_DATA_BUTTON_SEE_ERROR_DETAILS': 'See details',
        'LNG_PAGE_IMPORT_DATA_ERROR_DETAILS_DIALOG_TITLE': 'Error details',
        'LNG_PAGE_IMPORT_DATA_BUTTON_SEE_RECORD_DATA': 'See data',
        'LNG_PAGE_IMPORT_DATA_RECORD_DATA_DIALOG_TITLE': 'Record data',

        /**
         * uiImportResultFields
         */
        'LNG_IMPORT_RESULT_FIELD_LABEL_RECORD_NO': 'Record no.',
        'LNG_IMPORT_RESULT_FIELD_LABEL_ERROR_MESSAGE': 'Error message',
        'LNG_IMPORT_RESULT_FIELD_LABEL_ERROR_DETAILS': 'Error details',
        'LNG_IMPORT_RESULT_FIELD_LABEL_ERROR_DATA': 'Record data',

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
        'LNG_PAGE_LIST_CLUSTERS_LABEL_NO_COLOR': 'No colour',

        /**
         * NEW GROUP
         * uiAsyncCotListPage
         */
        'LNG_PAGE_LIST_ASYNC_COT_TITLE': 'Chains of transmission snapshots',
        'LNG_PAGE_LIST_ASYNC_COT_ACTION_DELETE_SNAPSHOT': 'Delete snapshot',
        'LNG_PAGE_LIST_ASYNC_COT_ACTION_DELETE_SUCCESS_MESSAGE': 'Snapshot deleted',

        /**
         * NEW GROUP
         * uiAsyncCotFields
         */
        'LNG_ASYNC_COT_FIELD_LABEL_STATUS': 'Status',
        'LNG_ASYNC_COT_FIELD_LABEL_START_DATE': 'Start date',
        'LNG_ASYNC_COT_FIELD_LABEL_END_DATE': 'End date',
        'LNG_ASYNC_COT_FIELD_LABEL_ERROR': 'Error',

        /**
         * uiDialogs
         */
        'LNG_DIALOG_CONFIRM_DELETE_COT_SNAPSHOT': 'Are you sure you want to delete this cot snapshot?',

        /**
         * uiChainsOfTransmissionGraph
         */
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_BUTTON_CONFIGURE_SETTINGS': 'Configure and generate new chain of transmission',
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_BUTTON_CONFIGURE_GRAPH': 'Configure chain of transmission snapshot',
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_BUTTON_LOAD_SNAPSHOT': 'See snapshot',
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_SNAPSHOT_STATUS__IN_PROGRESS': '{{name}} is still in progress',
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_GENERATE_SNAPSHOT_IN_PROGRESS': 'Generating snapshot'

        /**
         * REMOVE the tokens from below
         */
        // LNG_PAGE_IMPORT_DATA_BUTTON_RESET_IMPORT_MAPPING
        // LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_BUTTON_RESET_SETTINGS
        // LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_RESET_CHAINS
    }
};
