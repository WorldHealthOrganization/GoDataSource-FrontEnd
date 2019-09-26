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
         * uiSideFilter
         */
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION': 'Question',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER': 'Which answer',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_ANY': 'Any of the answers',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_LAST': 'Last Answer',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_DATE_FROM': 'Answer date - from',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_DATE_TO': 'Answer date - to',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_HAS_VALUE': 'Has value',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_DOESNT_HAVE_VALUE': 'Doesn\'t have value',
        'LNG_SIDE_FILTERS_COMPARATOR_LABEL_SELECT_HAS_AT_LEAST_ONE': 'Has at least one of these values',

        /**
         * uiCaseLabResultsFields
         */
        'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION': 'Classification',
        'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION_DESCRIPTION': '',
        'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION_INFO': 'Current classification of the case:',

        /**
         * uiBulkAddContactsPage
         */
        'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_API_ERROR_MSG': ' - row {{row}} is invalid: {{err}}',
        'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_PARTIAL_ERROR_MSG': ' - records that were created with success were removed from the spreadsheet so we don\'t create duplicates',

        /**
         * uiDialogs
         */
        'LNG_DIALOG_CONFIRM_CHANGE_CASE_EPI_CLASSIFICATION': 'Are you sure you want to change "{{ caseName }}" classification to "{{ classification }}"?',
        'LNG_DIALOG_CONFIRM_DELETE_VACCINE': 'Are you sure you want to delete this vaccine?',

        /**
         * uiFollowUpsListPage
         */
        'LNG_PAGE_LIST_FOLLOW_UPS_NO_TEAM_LABEL': 'No Team',

        /**
         * uiLabResultsListPage
         */
        'LNG_PAGE_LIST_LAB_RESULTS_ACTION_CHANGE_CASE_EPI_CLASSIFICATION_SUCCESS_MESSAGE': 'Case classification modified!',

        /**
         * uiCaseFields
         */
        'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL': 'Place of burial',
        'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL_DESCRIPTION': '',
        'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME': 'Burial place name',
        'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME_DESCRIPTION': '',
        'LNG_CASE_FIELD_LABEL_ADDRESS_LOCATION': 'Area',
        'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED_DETAILS': 'Vaccines received',
        'LNG_CASE_FIELD_LABEL_DATE_OF_EXPOSURE': 'Exposure Date ( {{exposureName}} )',
        'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS': 'Pregnancy status',
        'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION': '',

        /**
         * uiImportData
         */
        'LNG_PAGE_IMPORT_DATA_BUTTON_SHOW_ERR_RECORD_DETAILS': 'Show details',
        'LNG_PAGE_IMPORT_DATA_BUTTON_HIDE_ERR_RECORD_DETAILS': 'Hide details',
        'LNG_PAGE_IMPORT_DATA_BUTTON_ERR_RECORD_DETAILS_FILE_TITLE': 'File input',
        'LNG_PAGE_IMPORT_DATA_BUTTON_ERR_RECORD_DETAILS_MODEL_TITLE': 'Data to be saved in database',
        'LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_DATE': 'Date',
        'LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_VALUE': 'Value',

        /**
         * uiContactsListPage
         */
        'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS': 'Change Contact Final Follow-Up Status',
        'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_TITLE': 'Are you sure you want to change the "Final Follow-Up Status" for {{count}} contact(s)?',
        'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_SUCCESS_MSG': 'Final status updated for {{count}} contact(s)',

        /**
         * uiContactFields
         */
        'LNG_CONTACT_FIELD_LABEL_DATE_OF_EXPOSURE': 'Exposure Date ( {{exposureName}} )',
        'LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED_DETAILS': 'Vaccines received',
        'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS': 'Pregnancy status',
        'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION': '',

        /**
         * uiGlobalFilterFields
         */
        'LNG_GLOBAL_FILTERS_FIELD_LABEL_CLASSIFICATION': 'Classification',

        /**
         * uiDialogs
         */
        'LNG_DIALOG_CONFIRM_CHANGE_SOURCE': 'Are you sure you want to set this entity as source for selected contacts?',

        /**
         * uiModifyCaseLabResultPage
         */
        'LNG_PAGE_VIEW_CASE_LAB_RESULT_FIELD_LABEL_CONTACT_WITH_INFO': '* This person is now a contact and lab tests were performed at the time when "{{ caseName }}" was registered as a case',

        /**
         * uiEntityRelationshipsListPage
         */
        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_CHANGE_SOURCE': 'Change source for selected items',

        /**
         * uiAvailableEntitiesForSwitchRelationshipPage
         */
        'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_TITLE': 'Available people for switch',
        'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_NO_CONTACTS_SELECTED': 'No contacts were selected',
        'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_SET_SOURCE_BUTTON': 'Set as source',
        'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_ACTION_SET_SOURCE_SUCCESS_MESSAGE': 'Source set successful',

        /**
         * uiSavedFiltersForPagesLabels
         */
        'LNG_APP_PAGE_AVAILABLE_ENTITIES_FOR_SWITCH': 'Available entities for switch',

        /**
         * uiCommonLabels
         */
        'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE': 'Use question variable',
        'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE_DESCRIPTION': 'When checked, questionnaire column headers will use question variables instead of question text',

        /**
         * uiEntityFields
         */
        'LNG_ENTITY_FIELD_LABEL_VACCINE': 'Vaccine',
        'LNG_ENTITY_FIELD_LABEL_VACCINE_DATE': 'Vaccine date',
        'LNG_ENTITY_FIELD_LABEL_VACCINE_STATUS': 'Vaccine status',

        /**
         * uiCommonButtons
         */
        'LNG_COMMON_BUTTON_ADD_VACCINE': 'Add another vaccine',

        /**
         * uiChronologyContactPage
         */
        'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_LABEL_FOLLOW_UP_HISTORY_END_DATE': 'Follow-up status \\"{{ status }}\\" End Date',
        'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_LABEL_FOLLOW_UP_HISTORY_START_DATE': 'Follow-up status \\"{{ status }}\\" Start Date'

        /**
         * REMOVE the tokens from below
         */
        // LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_1
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_2
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_3
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_4
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_5
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_6
        // LNG_PAGE_IMPORT_DATA_LABEL_LEVEL_7
    }
};
