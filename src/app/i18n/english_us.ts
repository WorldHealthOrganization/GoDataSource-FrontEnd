export const EnglishUsLang = {
    id: 'english_us',
    tokens: {
        /**
         * Generic layout
         */
        'LNG_LAYOUT_MENU_BUTTON_LABEL': 'MENU',
        'LNG_LAYOUT_MENU_ITEM_LOGOUT_LABEL': 'Log Out',
        'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL': 'Change Password',
        'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL': 'Admin',
        'LNG_LAYOUT_MENU_ITEM_SYSTEM_CONFIG_LABEL': 'System Configuration',
        'LNG_LAYOUT_MENU_ITEM_USERS_LABEL': 'Users',
        'LNG_LAYOUT_MENU_ITEM_ROLES_LABEL': 'Roles',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL': 'Outbreaks',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEMPLATES_LABEL': 'Templates',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEAMS_LABEL': 'Teams',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAK_CLUSTERS_LABEL': 'Clusters',
        'LNG_LAYOUT_MENU_ITEM_CONTACTS_LABEL': 'Contacts',
        'LNG_LAYOUT_MENU_ITEM_CONTACTS_FOLLOW_UPS_LABEL': 'Upcoming Follow-ups',
        'LNG_LAYOUT_MENU_ITEM_CASES_LABEL': 'Cases',
        'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL': 'Events',
        'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL': 'Duplicated Records',
        'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL': 'Reference Data',
        'LNG_LAYOUT_MENU_ITEM_HELP_LABEL': 'Help & Support',
        'LNG_LAYOUT_SELECTED_OUTBREAK_LABEL': 'Selected Outbreak',
        'LNG_LAYOUT_LANGUAGE_LABEL': 'Language',
        'LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE': 'Language changed!',
        'LNG_LAYOUT_LIST_DEFAULT_FILTER_PLACEHOLDER': 'Filter',

        /**
         * Common labels
         */
        'LNG_COMMON_LABEL_YES': 'Yes',
        'LNG_COMMON_LABEL_NO': 'No',

        /**
         * Dialogs
         */
        'LNG_DIALOG_CONFIRM_BUTTON_YES': 'Yes',
        'LNG_DIALOG_CONFIRM_BUTTON_CANCEL': 'Cancel',
        'LNG_DIALOG_CONFIRM_DELETE_CASE': 'Are you sure you want to delete this case: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_HOSPITALIZATION_DATE': 'Are you sure you want to delete this hospitalization date?',
        'LNG_DIALOG_CONFIRM_DELETE_ISOLATION_DATE': 'Are you sure you want to delete this isolation date?',
        'LNG_DIALOG_CONFIRM_DELETE_CONTACT': 'Are you sure you want to delete this contact: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_ADDRESS': 'Are you sure you want to delete this address?',
        'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT': 'Are you sure you want to delete this document?',
        'LNG_DIALOG_CONFIRM_DELETE_EVENT': 'Are you sure you want to delete this event: {{name}}',
        'LNG_DIALOG_CONFIRM_DELETE_USER': 'Are you sure you want to delete this user: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_USER_ROLE': 'Are you sure you want to delete this role: {{name}}?',
        'LNG_DIALOG_CONFIRM_DELETE_OUTBREAK': 'Are you sure you want to delete the outbreak {{name}}?',
        'LNG_DIALOG_CONFIRM_MAKE_OUTBREAK_ACTIVE': 'Are you sure you want to set this outbreak active ? <br /> The other active outbreak will be deactivated',
        'LNG_DIALOG_CONFIRM_DELETE_QUESTION': 'Are you sure you want to delete this question?',
        'LNG_DIALOG_CONFIRM_DUPLICATE_QUESTION': 'Are you sure you want to duplicate this question?',
        'LNG_DIALOG_CONFIRM_DELETE_QUESTION_ANSWER': 'Are you sure you want to delete this answer?',
        'LNG_DIALOG_CONFIRM_LINK_QUESTION_ANSWER': 'Are you sure you want to link this answer?',
        'LNG_DIALOG_CONFIRM_DELETE_REFERENCE_DATA_ENTRY': 'Are you sure you want to delete this entry?',

        /**
         * Login page
         */
        'LNG_PAGE_LOGIN_WELCOME_MESSAGE': 'Welcome!',
        'LNG_PAGE_LOGIN_LOGIN_LABEL': 'Login',
        'LNG_PAGE_LOGIN_FORGOT_PASSWORD_LABEL': 'Forgot Password?',
        'LNG_PAGE_LOGIN_ACTION_LOGIN_SUCCESS_MESSAGE': `Welcome, {{name}}!`,

        /**
         * Form Errors, Warnings and Success messages
         */
        'LNG_FORM_ERROR_FORM_INVALID': 'The form is invalid!',
        'LNG_FORM_WARNING_NO_CHANGES': 'There are no changes to be saved!',

        /**
         * API Errors
         */
        'LNG_API_ERROR_CODE_UNKNOWN_ERROR': 'Something went wrong! Please contact an administrator.',
        'LNG_API_ERROR_CODE_LOGIN_FAILED': 'Login failed!',

        /**
         * Common Fields
         */
        'LNG_COMMON_FIELD_LABEL_EMAIL_ADDRESS': 'Email Address',
        'LNG_COMMON_FIELD_LABEL_PASSWORD': 'Password',
        'LNG_COMMON_FIELD_LABEL_CURRENT_PASSWORD': 'Current Password',

        /**
         * Address Fields
         */
        'LNG_ADDRESS_FIELD_LABEL_NAME': 'Name',
        'LNG_ADDRESS_FIELD_LABEL_LOCATION': 'Area',
        'LNG_ADDRESS_FIELD_LABEL_CITY': 'City',
        'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE': 'ZIP',
        'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1': 'Address',

        /**
         * Outbreak Fields
         */
        'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT': 'Number of days new contact',

        /**
         * Case Fields
         */
        'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION': 'Date of Infection',
        'LNG_CASE_FIELD_LABEL_FILL_GEO_LOCATION_LAT': 'Fill Geo-Location Latitude',
        'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME': 'Date of Outcome',
        'LNG_CASE_FIELD_LABEL_AGE': 'Age',
        'LNG_CASE_FIELD_LABEL_FIRST_NAME': 'First Name',
        'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET': 'Date of Onset',
        'LNG_CASE_FIELD_LABEL_RISK_REASON': 'Risk Reason',
        'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_DATES': 'Hospitalization Dates',
        'LNG_CASE_FIELD_LABEL_ID': 'ID',
        'LNG_CASE_FIELD_LABEL_UPDATED_AT': 'Updated At',
        'LNG_CASE_FIELD_LABEL_OUTBREAK_ID': 'Outbreak ID',
        'LNG_CASE_FIELD_LABEL_DOB': 'Date of Birth',
        'LNG_CASE_FIELD_LABEL_CREATED_BY': 'Created By',
        'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE': 'Date of Becoming case',
        'LNG_CASE_FIELD_LABEL_MIDDLE_NAME': 'Middle Name',
        'LNG_CASE_FIELD_LABEL_INCUBATION_DATES': 'Incubation Dates',
        'LNG_CASE_FIELD_LABEL_DELETED_AT': 'Deleted At',
        'LNG_CASE_FIELD_LABEL_FILL_GEO_LOCATION_LNG': 'Fill Geo-Location Longitude',
        'LNG_CASE_FIELD_LABEL_DELETED': 'Deleted',
        'LNG_CASE_FIELD_LABEL_UPDATED_BY': 'Updated By',
        'LNG_CASE_FIELD_LABEL_CREATED_AT': 'Created At',
        'LNG_CASE_FIELD_LABEL_TYPE': 'Type',
        'LNG_CASE_FIELD_LABEL_PHONE_NUMBER': 'Phone Number',
        'LNG_CASE_FIELD_LABEL_GENDER': 'Gender',
        'LNG_CASE_FIELD_LABEL_CLASSIFICATION': 'Classification',
        'LNG_CASE_FIELD_LABEL_OCCUPATION': 'Ocupation',
        'LNG_CASE_FIELD_LABEL_DOCUMENT_TYPE': 'Document Type',
        'LNG_CASE_FIELD_LABEL_RISK_LEVEL': 'Risk Level',
        'LNG_CASE_FIELD_LABEL_ISOLATION_DATES': 'Isolation Dates',
        'LNG_CASE_FIELD_LABEL_DECEASED': 'Deceased',
        'LNG_CASE_FIELD_LABEL_LAST_NAME': 'Last Name',
        'LNG_CASE_FIELD_LABEL_DATE_DECEASED': 'Date of Decease',
        'LNG_CASE_FIELD_LABEL_DOCUMENT_NUMBER': 'Document Number',

        /**
         * Cases list page
         */
        'LNG_PAGE_LIST_CASES_TITLE': 'Cases',

        /**
         * Create Case page
         */
        'LNG_PAGE_CREATE_CASE_TITLE': 'Create New Case',
        'LNG_PAGE_CREATE_CASE_TAB_ADDRESS_TITLE': 'Address',

        /**
         * Modify Case page
         */
        'LNG_PAGE_MODIFY_CASE_TITLE': 'Modify Case',

        /**
         * Contact Fields
         */
        'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL': 'Risk Level',
        'LNG_CONTACT_FIELD_LABEL_RISK_REASON': 'Reason',

        /**
         * Contacts list page
         */
        'LNG_PAGE_LIST_CONTACTS_TITLE': 'Contacts',

        /**
         * Create Contact page
         */
        'LNG_PAGE_CREATE_CONTACT_TITLE': 'Create New Contact',
        'LNG_PAGE_CREATE_CONTACT_TAB_ADDRESS_TITLE': 'Address',
        'LNG_PAGE_CREATE_CONTACT_WARNING_CASE_REQUIRED': 'You can add a contact only though a case!',
        'LNG_PAGE_CREATE_CONTACT_TAB_RELATIONSHIP_TITLE': 'Relationship',
        'LNG_PAGE_CREATE_CONTACT_TAB_RELATIONSHIP_RELATE_TITLE': 'Case',

        /**
         * Modify Contact page
         */
        'LNG_PAGE_MODIFY_CONTACT_TITLE': 'Modify Contact',
        'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_SECTION_FLAG_CONTACT_TITLE': 'Flag contact with a risk for additional attention',

        /**
         * Relationship Fields
         */
        'LNG_RELATIONSHIP_FIELD_CONTACT_DATE': 'Date of last contact',
        'LNG_RELATIONSHIP_FIELD_CONTACT_DATE_ESTIMATED': 'Is Contact Date Estimated?',
        'LNG_RELATIONSHIP_FIELD_CERTAINTY_LEVEL': 'Certainty Level',
        'LNG_RELATIONSHIP_FIELD_EXPOSURE_TYPE': 'Exposure Type',
        'LNG_RELATIONSHIP_FIELD_EXPOSURE_FREQUENCY': 'Exposure Frequency',
        'LNG_RELATIONSHIP_FIELD_EXPOSURE_DURATION': 'Exposure Duration',
        'LNG_RELATIONSHIP_FIELD_RELATION': 'Relation',
        'LNG_RELATIONSHIP_FIELD_CLUSTER': 'Cluster',
        'LNG_RELATIONSHIP_FIELD_COMMENT': 'Comment',

        /**
         * Follow-up fields
         */
        'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_FIRST_NAME': 'First Name',
        'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_LAST_NAME': 'Last Name',
        'LNG_FOLLOW_UP_FIELD_LABEL_DATE': 'Date',
        'LNG_FOLLOW_UP_FIELD_LABEL_AREA': 'Area',
        'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS': 'Address',
        'LNG_FOLLOW_UP_FIELD_LABEL_PERFORMED': 'Performed',
        'LNG_FOLLOW_UP_FIELD_LABEL_LOST_TO_FOLLOW_UP': 'Lost to Follow-up',

        /**
         * Follow-ups list page
         */
        'LNG_PAGE_LIST_FOLLOW_UPS_TITLE': 'Follow-ups',
        'LNG_PAGE_LIST_FOLLOW_UPS_GENERATE_BUTTON': 'Generate Follow-up',
        'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_SUCCESS_MESSAGE': 'Follow-ups generated!',

        /**
         * Create Follow-up page
         */
        'LNG_PAGE_CREATE_FOLLOW_UP_TITLE': 'Create New Follow-up',
        'LNG_PAGE_CREATE_FOLLOW_UP_TAB_ADDRESS_TITLE': 'Address',
        'LNG_PAGE_CREATE_FOLLOW_UP_WARNING_CONTACT_REQUIRED': 'You can add a follow-up only though a contact!',
        'LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_SUCCESS_MESSAGE': 'Follow-up added!',

        /**
         * Event fields
         */
        'LNG_EVENT_FIELD_LABEL_ADDRESS': 'Address',

        /**
         * Create Event page
         */
        'LNG_PAGE_CREATE_EVENT_TAB_ADDRESS_TITLE': 'Address',

        /**
         * Permissions
         */
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_ROLE': 'Read Role',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_REPORT_DESCRIPTION': 'This permission allows creating/visualizing reports.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_ROLE_DESCRIPTION': 'This permission allows creating/modifying/removing roles information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_TEAM': 'Read Team',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CONTACT': 'Read Contact',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_USER_ACCOUNT_DESCRIPTION': 'This permission allows reading user accounts information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CASE': 'Read Case',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_OUTBREAK': 'Write Outbreak',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_USER_ACCOUNT': 'Read User Account',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_SYS_CONFIG': 'Write System Configuration',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CONTACT_DESCRIPTION': 'This permission allows reading contact related information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_TEAM': 'Write Team',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_USER_ACCOUNT_DESCRIPTION': 'This permission allows creating/modifying/removing user accounts information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_FOLLOW_UP': 'Read Follow-up',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_REFERENCE_DATA_DESCRIPTION': 'This permission allows modifying system reference data.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_FOLLOW_UP_DESCRIPTION': 'This permission allows creating/modifying/removing follow-up information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_TEAM_DESCRIPTION': 'This permission allows creating/modifying/removing teams information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_USER_ACCOUNT': 'Write User Account',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_OUTBREAK_DESCRIPTION': 'This permission allows reading outbreak information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CASE': 'Write Case',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CASE_DESCRIPTION': 'This permission allows reading case related information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_SYS_CONFIG': 'Read System Configuration',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_ROLE': 'Write Role',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CONTACT': 'Write Contact',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_OUTBREAK_DESCRIPTION': 'This permission allows creating/modifying/removing outbreak information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_SYS_CONFIG_DESCRIPTION': 'This permission allows modifying system configuration settings.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_FOLLOW_UP': 'Write Follow-up',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_REFERENCE_DATA': 'Write Reference Data',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_TEAM_DESCRIPTION': 'This permission allows reading teams information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_OUTBREAK': 'Read Outbreak',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_FOLLOW_UP_DESCRIPTION': 'This permission allows reading contact follow-up information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_REPORT': 'Read Report',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CONTACT_DESCRIPTION': 'This permission allows creating/modifying/removing contact information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CASE_DESCRIPTION': 'This permission allows creating/modifying/removing case information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_SYS_CONFIG_DESCRIPTION': 'This permission allows reading system configuration settings.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_ROLE_DESCRIPTION': 'This permission allows reading roles information.',

        /**
         * Reference Data categories
         */
        'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL': 'Risk Level',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_INTENSITY': 'Exposure Intensity',
        'LNG_REFERENCE_DATA_CATEGORY_GENDER': 'Gender',
        'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_SAMPLE': 'Type Of Sample',
        'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL': 'Certainty Level',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_FREQUENCY': 'Exposure Frequency',
        'LNG_REFERENCE_DATA_CATEGORY_STATUS': 'Status',
        'LNG_REFERENCE_DATA_CATEGORY_LAB_NAME': 'Lab Name',
        'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT': 'Lab Test Result',
        'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION': 'Context of Transmission',
        'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION': 'Case Classification',
        'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_LAB_TEST': 'Type Of Lab Result',
        'LNG_REFERENCE_DATA_CATEGORY_OCCUPATION': 'Occupation',
        'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE': 'Document Type',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE': 'Exposure Type',
        'LNG_REFERENCE_DATA_CATEGORY_DISEASE': 'Disease',

        /**
         * Reference Data Category fields
         */
        'LNG_REFERENCE_DATA_CATEGORY_FIELD_LABEL_CATEGORY_NAME': 'Category Name',
        'LNG_REFERENCE_DATA_CATEGORY_FIELD_LABEL_ENTRIES': 'Entries',

        /**
         * Reference Data Entry fields
         */
        'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE': 'Label',
        'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION': 'Description',
        'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON': 'Icon',
        'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR': 'Color',
        'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE': 'Active',

        /**
         * Reference Data - Categories List page
         */
        'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE': 'Reference Data',

        /**
         * Reference Data - Category Entries List page
         */
        'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY_SUCCESS_MESSAGE': 'Reference Data entry deleted!',

        /**
         * Create Reference Data Entry page
         */
        'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_TITLE': 'Create New Entry',
        'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE': 'Reference Data entry created!',


        /**
         * Modify Reference Data Entry page
         */
        'LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE': 'Reference Data entry modified!',

        /**
         * Outbreak Templates
         */
        'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_FREE_TEXT': 'Free Text',
        'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_MULTIPLE_ANSWER': 'Multiple Answers',
        'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_DATE_TIME': 'Date/Time',
        'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_NUMERIC': 'Numeric',
        'LNG_TEMPLATE_QUESTION_ANSWER_TYPE_SINGLE_ANSWER': 'Single Answer',

        /**
         * Security Questions
         */
        'LNG_SECURITY_QUESTION_10': 'In what town or city did you meet your spouse/partner?',
        'LNG_SECURITY_QUESTION_8': 'What is the middle name of your oldest child?',
        'LNG_SECURITY_QUESTION_1': 'What was your childhood nickname?',
        'LNG_SECURITY_QUESTION_2': 'In what city or town did your mother and father meet?',
        'LNG_SECURITY_QUESTION_4': 'What was your favorite sport in high school?',
        'LNG_SECURITY_QUESTION_9': 'In what town or city was your first full time job?',
        'LNG_SECURITY_QUESTION_3': 'What is your favorite team?',
        'LNG_SECURITY_QUESTION_5': 'What was the house number and street name you lived in as a child?',
        'LNG_SECURITY_QUESTION_6': 'What primary school did you attend?',
        'LNG_SECURITY_QUESTION_7': 'What is your spouse or partner\'s mother\'s maiden name?',

        /**
         * Forgot Password Page
         */
        'LNG_PAGE_FORGOT_PASSWORD_TITLE': 'Reset Password',
        'LNG_PAGE_FORGOT_PASSWORD_DESCRIPTION': 'In order to reset your password, please input the email address associated with your account and press Reset Password button.',
        'LNG_PAGE_FORGOT_PASSWORD_SECURITY_QUESTIONS_BUTTON': 'Use Security Questions',
        'LNG_PAGE_FORGOT_PASSWORD_BUTTON': 'Reset Password',

        /**
         * Reset Password Using Security Questions Page
         */
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_TITLE': 'Reset Password',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_DESCRIPTION': 'In order to reset your password, please input the email address associated with your account and the security questions and answers',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_BUTTON': 'Reset Password',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_FIELD_LABEL_QUESTION1': 'Question 1',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_FIELD_LABEL_QUESTION2': 'Question 2',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_FIELD_LABEL_ANSWER1': 'Answer 1',
        'LNG_PAGE_RESET_PASSWORD_SECURITY_QUESTIONS_FIELD_LABEL_ANSWER2': 'Answer 2',

        /**
         * Reset Password Page
         */
        'LNG_PAGE_RESET_PASSWORD_TITLE': 'Reset Password',
        'LNG_PAGE_RESET_PASSWORD_BUTTON': 'Change Password',
        'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_NEW_PASSWORD': 'New Password',
        'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CONFIRM_NEW_PASSWORD': 'Confirm New Password',

        /**
         * Change Password Page
         */
        'LNG_PAGE_CHANGE_PASSWORD_SECURITY_QUESTIONS_NOTIFICATION': 'We recommend setting the security questions which will allow you to change your password even ' +
                                            'if there are connectivity issues. However, this can be done later as well from the user menu.',
        'LNG_PAGE_CHANGE_PASSWORD_DESCRIPTION': 'You must change your password to be different from the default one!',
        'LNG_PAGE_CHANGE_PASSWORD_SECURITY_QUESTIONS_BUTTON': 'Set Security Questions',
        'LNG_PAGE_CHANGE_PASSWORD_LATER_BUTTON': 'Later',
        'LNG_PAGE_CHANGE_PASSWORD_SUCCESS_MESSAGE': 'Password Changed'


    }
};
