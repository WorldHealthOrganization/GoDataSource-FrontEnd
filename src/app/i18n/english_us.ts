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
        // 'LNG_EXAMPLE_TOKEN': 'Example value',

        /**
         * uiOutbreakListPage
         */
        'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE': 'Case form',
        'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE': 'Follow-up form',
        'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE': 'Lab Results form',

        /**
         * uiOutbreakTemplateListPage
         */
        'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE': 'Case form',
        'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE': 'Follow-up form',
        'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE': 'Lab Results form',

        /**
         * uiModifyOutbreakPage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE': 'Case form',
        'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE': 'Follow-up form',
        'LNG_PAGE_MODIFY_OUTBREAK_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE': 'Lab form',

        /**
         * uiModifyOutbreakTemplatePage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE': 'Case form',
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE': 'Follow-up form',
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE': 'Lab form',

        /**
         * NEW GROUP
         * uiModifyOutbreakQuestionnairePage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_OUTBREAK_TITLE': '{{name}}',
        'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_CASE_TITLE': 'Case investigation',
        'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_FOLLOW_UP_TITLE': 'Contact follow-up',
        'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_LAB_RESULT_TITLE': 'Lab Results',

        /**
         * NEW GROUP
         * uiModifyOutbreakTemplateQuestionnairePage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_OUTBREAK_TITLE': '{{name}}',
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_CASE_TITLE': 'Case investigation',
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_FOLLOW_UP_TITLE': 'Contact follow-up',
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_LAB_RESULT_TITLE': 'Lab Results',

        /**
         * uiOutbreakQuestionnaireTemplates
         */
        'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_UP': 'Move Up',
        'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_DOWN': 'Move Down',
        'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_ANSWER_UP': 'Move Up',
        'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_ANSWER_DOWN': 'Move Down',
        'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_ORDER': 'Order',
        'LNG_QUESTIONNAIRE_TEMPLATE_QUESTION_ANSWER_FIELD_LABEL_ORDER_DESCRIPTION': '',

        /**
         * uiDialogs
         */
        'LNG_DIALOG_CONFIRM_DELETE_NEW_QUESTION': 'Since this is a new question, it will be removed if you cancel. Do you want to continue?',
        'LNG_DIALOG_CONFIRM_DELETE_NEW_QUESTION_ANSWER': 'Since this is a new answer, it will be removed if you cancel. Do you want to continue?',
        'LNG_DIALOG_CONFIRM_LOOSE_CHANGES_QUESTION': 'There are unsaved changes that will be lost if you continue',
        'LNG_DIALOG_CONFIRM_LOOSE_CHANGES_QUESTION_ANSWER': 'There are unsaved changes that will be lost if you continue'

        // some tokens might need to be removed
        // - create & modify outbreak & outbreak template => case investigation, contact follow-up, lab results tab tokens etc..since these won't be used anymore
        // - before removing these tokens make sure they aren't used
    }
};
