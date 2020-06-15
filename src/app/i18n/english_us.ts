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
         * uiBackupFields
         */
        'LNG_BACKUP_FIELD_LABEL_DESCRIPTION': 'Description',
        'LNG_BACKUP_FIELD_LABEL_DESCRIPTION_DESCRIPTION': '',

        /**
         * uiAutomaticBackupFields
         */
        'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION': 'Description',
        'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION_DESCRIPTION': '',

        /**
         * uiOutbreakListPage
         */
        'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE': 'Contact form',

        /**
         * uiOutbreakTemplateListPage
         */
        'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE': 'Contact form',

        /**
         * uiModifyOutbreakTemplateQuestionnairePage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTIONNAIRE_CONTACT_TITLE': 'Contact investigation',

        /**
         * uiModifyOutbreakQuestionnairePage
         */
        'LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_CONTACT_TITLE': 'Contact investigation',

        /**
         * uiChainsOfTransmissionGraph
         */
        'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_LABEL_OPTION_DATE_OF_ONSET_AND_EVENT_DATE': 'Date of onset/Event',

        /**
         * uiCasesListPage
         */
        'LNG_PAGE_LIST_CASES_ACTION_IMPORT_CASES_RELATIONSHIPS' : 'Import case relationships',

        /**
         * uiContactsListPage
         */
        'LNG_PAGE_LIST_CONTACTS_ACTION_IMPORT_CONTACTS_RELATIONSHIPS': 'Import contact relationships',

        /**
         * uiEventsListPage
         */
        'LNG_PAGE_LIST_EVENTS_ACTION_IMPORT_EVENTS_RELATIONSHIPS': 'Import event relationships',

        /**
         * uiImportData
         */
        'LNG_PAGE_IMPORT_CASE_RELATIONSHIP_DATA_TITLE' : 'Import case relationships',
        'LNG_PAGE_IMPORT_CONTACT_RELATIONSHIP_DATA_TITLE' : 'Import contact relationships',
        'LNG_PAGE_IMPORT_EVENT_RELATIONSHIP_DATA_TITLE' : 'Import event relationships',

        /**
         * uiCreateOutbreakPage
         */
        'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION': 'Option specifying whether the round-robin team assignment should be done taking in consideration all teams activating in the contact\'s location (via that location or parents) or just the nearest teams. Default: round-robin of all teams activating in the contact\'s location. ' +
            'Round-robin team assignment implies the following: after a pool of teams that can be assigned to the follow-up is created, for each follow-up that is generated, the team is chosen in order from the pool. After the assignment, the team is removed from the pool until the pool of teams is emptied. Then the pool resets with the original chosen teams so the process can start again.',

        /**
         * uiCreateOutbreakTemplatePage
         */
        'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION': 'Option specifying whether the round-robin team assignment should be done taking in consideration all teams activating in the contact\'s location (via that location or parents) or just the nearest teams. Default: round-robin of all teams activating in the contact\'s location. ' +
            'Round-robin team assignment implies the following: after a pool of teams that can be assigned to the follow-up is created, for each follow-up that is generated, the team is chosen in order from the pool. After the assignment, the team is removed from the pool until the pool of teams is emptied. Then the pool resets with the original chosen teams so the process can start again.',







        /**
         * REMOVE the tokens from below
         */
        // ...
    }
};
