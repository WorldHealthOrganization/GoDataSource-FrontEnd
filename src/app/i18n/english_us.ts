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
         * uiModifyFollowUpPage
         */
        'LNG_FOLLOW_UP_FIELD_LABEL_CASE' : 'Case:',
        'LNG_PAGE_MODIFY_FOLLOW_UP_FIELD_LABEL_FOLLOW_UP_WITH_INFO': '* This person is now a case and follow-up was performed at the time when \'{{ personName }}\' was registered as a contact"',

        /**
         * uiModifyFollowUpListPage
         */
        'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_PERSON_FOLLOW_UP_INFO': '* Persons that now are cases (the follow-ups were performed when they were contacts)  : {{ personsToBeDisplayed }}',
        'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_MODIFY_DATA_IN_THE_FUTURE_LABEL': '*You can\'t modify some fields because at least one of the selected follow-ups is in the future',

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
         * uiFollowUpFields
         */
        'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL': 'Email',

        /**
         * uiLoginPage
         */
        'LNG_PAGE_LOGIN_ACTION_LOGIN_2FA_CODE_REQUIRED': 'The code was sent to the following email "{{email}}"',
        'LNG_COMMON_FIELD_LABEL_CODE': 'Code',

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
        'LNG_USER_FIELD_LABEL_TEAMS': 'Teams'



        /**
         * REMOVE the tokens from below
         */
        // ...
    }
};
