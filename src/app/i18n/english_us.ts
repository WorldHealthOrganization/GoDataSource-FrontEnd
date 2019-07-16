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
         * uiModifyFollowUpListPage
         */
        'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_FOLLOW_UPS_DATES': 'Follow-ups dates:',
        'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_MODIFY_DATA_INFO_LABEL': '*The system will replace only data that is changed. If you don\'t enter any data, then the system won\'t update the data to any of the selected follow-ups',

        /**
         * uiTeamsWorkload
         */
        'LNG_PAGE_TEAMS_WORKLOAD_NO_TEAM_LABEL': '--- NO TEAM ---',

        /**
         * uiAPIErrors
         */
        'LNG_API_ERROR_CODE_DELETE_CONTACT_LAST_RELATIONSHIP': 'Cannot delete a contact\'s last relationship with a case or event. The contact doesn\'t have an additional relationship with a case or event.',
        'LNG_API_ERROR_CODE_INVALID_CASE_RELATIONSHIP': 'Case needs to be related to another case in order to be able to convert it to a contact',
        'LNG_API_ERROR_CODE_INVALID_PASSWORD': 'Invalid current password',

        /**
         * uiBulkAddContactsPage
         */
        'LNG_PAGE_BULK_ADD_CONTACTS_VISUAL_ID_INFO_LABEL': '* "Contact ID" cell must follow this pattern: {{mask}}',

        /**
         * uiDialogs
         */
        'LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIPS': 'Are you sure you want to delete selected relationships?',

        /**
         * uiEntityRelationshipsListPage
         */
        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS': 'Delete selected relationships',
        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS_SUCCESS_MESSAGE': 'Relationships deleted',

        /**
         * uiModifyCaseLabResultPage
         */
        'LNG_PAGE_VIEW_CASE_LAB_RESULT_FIELD_LABEL_CONTACT': 'Contact',
        'LNG_PAGE_VIEW_CASE_LAB_RESULT_FIELD_LABEL_CONTACT_WITH_INFO': '* This person is now a contact and lab tests were performed at the time when "{{ caseName }}" was registered as a case',

        /**
         * uiEntityRelationshipsListPage
         */
        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_CHANGE_SOURCE': 'Change source'


        /**
         * REMOVE the tokens from below
         */
        // ...
    }
};
