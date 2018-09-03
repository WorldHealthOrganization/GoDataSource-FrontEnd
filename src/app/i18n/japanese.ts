export const JapaneseLang = {
    id: 'japanese_jp',
    tokens: {
        /**
         * Generic layout
         */
        'LNG_LAYOUT_MENU_BUTTON_LABEL': '[言語] MENU',
        'LNG_LAYOUT_MENU_ITEM_LOGOUT_LABEL': '[言語] Log Out',
        'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL': '[言語] Change Password',
        'LNG_LAYOUT_MENU_ITEM_ADMIN_LABEL': '[言語] Admin',
        'LNG_LAYOUT_MENU_ITEM_SYSTEM_CONFIG_LABEL': '[言語] System Configuration',
        'LNG_LAYOUT_MENU_ITEM_USERS_LABEL': '[言語] Users',
        'LNG_LAYOUT_MENU_ITEM_ROLES_LABEL': '[言語] Roles',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL': '[言語] Outbreaks',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEMPLATES_LABEL': '[言語] Templates',
        'LNG_LAYOUT_MENU_ITEM_OUTBREAK_TEAMS_LABEL': '[言語] Teams',
        'LNG_LAYOUT_MENU_ITEM_CLUSTERS_LABEL': '[言語] Clusters',
        'LNG_LAYOUT_MENU_ITEM_CONTACTS_LABEL': '[言語] Contacts',
        'LNG_LAYOUT_MENU_ITEM_CASES_LABEL': '[言語] Cases',
        'LNG_LAYOUT_MENU_ITEM_EVENTS_LABEL': '[言語] Events',
        'LNG_LAYOUT_MENU_ITEM_DUPLICATED_RECORDS_LABEL': '[言語] Duplicated Records',
        'LNG_LAYOUT_MENU_ITEM_REFERENCE_DATA_LABEL': '[言語] Reference Data',
        'LNG_LAYOUT_MENU_ITEM_HELP_LABEL': '[言語] Help & Support',
        'LNG_LAYOUT_SELECTED_OUTBREAK_LABEL': '[言語] Selected Outbreak',
        'LNG_LAYOUT_LANGUAGE_LABEL': '[言語] Language',
        'LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE': '[言語] Language changed!',

        /**
         * Dialogs
         */
        'LNG_DIALOG_CONFIRM_BUTTON_YES': '[言語] Yes',
        'LNG_DIALOG_CONFIRM_BUTTON_CANCEL': '[言語] Cancel',
        'LNG_DIALOG_CONFIRM_DELETE_CASE': '[言語] Are you sure you want to delete this case: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_CONTACT': '[言語] Are you sure you want to delete this contact: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_ADDRESS': '[言語] Are you sure you want to delete this address?',
        'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT': '[言語] Are you sure you want to delete this document?',
        'LNG_DIALOG_CONFIRM_DELETE_EVENT': '[言語] Are you sure you want to delete this event: {{name}}',
        'LNG_DIALOG_CONFIRM_DELETE_USER': '[言語] Are you sure you want to delete this user: {{firstName}} {{lastName}}?',
        'LNG_DIALOG_CONFIRM_DELETE_USER_ROLE': '[言語] Are you sure you want to delete this role: {{name}}?',
        'LNG_DIALOG_CONFIRM_DELETE_OUTBREAK': '[言語] Are you sure you want to delete the outbreak {{name}}?',
        'LNG_DIALOG_CONFIRM_MAKE_OUTBREAK_ACTIVE': '[言語] Are you sure you want to set this outbreak active ? <br /> The other active outbreak will be deactivated',
        'LNG_DIALOG_CONFIRM_DELETE_QUESTION': '[言語] Are you sure you want to delete this question?',
        'LNG_DIALOG_CONFIRM_DUPLICATE_QUESTION': '[言語] Are you sure you want to duplicate this question?',
        'LNG_DIALOG_CONFIRM_DELETE_QUESTION_ANSWER': '[言語] Are you sure you want to delete this answer?',
        'LNG_DIALOG_CONFIRM_LINK_QUESTION_ANSWER': '[言語] Are you sure you want to link this answer?',

        /**
         * Login page
         */
        'LNG_PAGE_LOGIN_WELCOME_MESSAGE': '[言語] Welcome!',
        'LNG_PAGE_LOGIN_LOGIN_LABEL': '[言語] Login',
        'LNG_PAGE_LOGIN_FORGOT_PASSWORD_LABEL': '[言語] Forgot Password?',
        'LNG_PAGE_LOGIN_ACTION_LOGIN_SUCCESS_MESSAGE': `Welcome, {{name}}!`,

        /**
         * API Errors
         */
        'LNG_API_ERROR_CODE_UNKNOWN_ERROR': '[言語] Something went wrong! Please contact an administrator.',
        'LNG_API_ERROR_CODE_LOGIN_FAILED': '[言語] Login failed!',

        /**
         * Common Fields
         */
        'LNG_COMMON_FIELD_LABEL_EMAIL_ADDRESS': '[言語] Email Address',
        'LNG_COMMON_FIELD_LABEL_PASSWORD': '[言語] Password',

        /**
         * Case Fields
         */
        'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION': '[言語] Date of Infection',
        'LNG_CASE_FIELD_LABEL_FILL_GEO_LOCATION_LAT': '[言語] Fill Geo-Location Latitude',
        'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME': '[言語] Date of Outcome',
        'LNG_CASE_FIELD_LABEL_AGE': '[言語] Age',
        'LNG_CASE_FIELD_LABEL_FIRST_NAME': '[言語] First Name',
        'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET': '[言語] Date of Onset',
        'LNG_CASE_FIELD_LABEL_RISK_REASON': '[言語] Risk Reason',
        'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_DATES': '[言語] Hospitalization Dates',
        'LNG_CASE_FIELD_LABEL_ID': '[言語] ID',
        'LNG_CASE_FIELD_LABEL_UPDATED_AT': '[言語] Updated At',
        'LNG_CASE_FIELD_LABEL_OUTBREAK_ID': '[言語] Outbreak ID',
        'LNG_CASE_FIELD_LABEL_DOB': '[言語] Date of Birth',
        'LNG_CASE_FIELD_LABEL_CREATED_BY': '[言語] Created By',
        'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE': '[言語] Date of Becoming case',
        'LNG_CASE_FIELD_LABEL_MIDDLE_NAME': '[言語] Middle Name',
        'LNG_CASE_FIELD_LABEL_INCUBATION_DATES': '[言語] Incubation Dates',
        'LNG_CASE_FIELD_LABEL_DELETED_AT': '[言語] Deleted At',
        'LNG_CASE_FIELD_LABEL_FILL_GEO_LOCATION_LNG': '[言語] Fill Geo-Location Longitude',
        'LNG_CASE_FIELD_LABEL_DELETED': '[言語] Deleted',
        'LNG_CASE_FIELD_LABEL_UPDATED_BY': '[言語] Updated By',
        'LNG_CASE_FIELD_LABEL_CREATED_AT': '[言語] Created At',
        'LNG_CASE_FIELD_LABEL_TYPE': '[言語] Type',
        'LNG_CASE_FIELD_LABEL_PHONE_NUMBER': '[言語] Phone Number',
        'LNG_CASE_FIELD_LABEL_GENDER': '[言語] Gender',
        'LNG_CASE_FIELD_LABEL_CLASSIFICATION': '[言語] Classification',
        'LNG_CASE_FIELD_LABEL_OCCUPATION': '[言語] Ocupation',
        'LNG_CASE_FIELD_LABEL_DOCUMENT_TYPE': '[言語] Document Type',
        'LNG_CASE_FIELD_LABEL_RISK_LEVEL': '[言語] Risk Level',
        'LNG_CASE_FIELD_LABEL_ISOLATION_DATES': '[言語] Isolation Dates',
        'LNG_CASE_FIELD_LABEL_DECEASED': '[言語] Deceased',
        'LNG_CASE_FIELD_LABEL_LAST_NAME': '[言語] Last Name',
        'LNG_CASE_FIELD_LABEL_DATE_DECEASED': '[言語] Date of Decease',
        'LNG_CASE_FIELD_LABEL_DOCUMENT_NUMBER': '[言語] Document Number',

        /**
         * Permissions
         */
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_ROLE': '[言語] Read Role',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_REPORT_DESCRIPTION': '[言語] This permission allows creating/visualizing reports.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_ROLE_DESCRIPTION': '[言語] This permission allows creating/modifying/removing roles information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_TEAM': '[言語] Read Team',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CONTACT': '[言語] Read Contact',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_USER_ACCOUNT_DESCRIPTION': '[言語] This permission allows reading user accounts information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CASE': '[言語] Read Case',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_OUTBREAK': '[言語] Write Outbreak',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_USER_ACCOUNT': '[言語] Read User Account',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_SYS_CONFIG': '[言語] Write System Configuration',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CONTACT_DESCRIPTION': '[言語] This permission allows reading contact related information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_TEAM': '[言語] Write Team',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_USER_ACCOUNT_DESCRIPTION': '[言語] This permission allows creating/modifying/removing user accounts information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_FOLLOW_UP': '[言語] Read Follow-up',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_REFERENCE_DATA_DESCRIPTION': '[言語] This permission allows modifying system reference data.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_FOLLOW_UP_DESCRIPTION': '[言語] This permission allows creating/modifying/removing follow-up information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_TEAM_DESCRIPTION': '[言語] This permission allows creating/modifying/removing teams information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_USER_ACCOUNT': '[言語] Write User Account',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_OUTBREAK_DESCRIPTION': '[言語] This permission allows reading outbreak information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CASE': '[言語] Write Case',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_CASE_DESCRIPTION': '[言語] This permission allows reading case related information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_SYS_CONFIG': '[言語] Read System Configuration',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_ROLE': '[言語] Write Role',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CONTACT': '[言語] Write Contact',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_OUTBREAK_DESCRIPTION': '[言語] This permission allows creating/modifying/removing outbreak information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_SYS_CONFIG_DESCRIPTION': '[言語] This permission allows modifying system configuration settings.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_FOLLOW_UP': '[言語] Write Follow-up',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_REFERENCE_DATA': '[言語] Write Reference Data',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_TEAM_DESCRIPTION': '[言語] This permission allows reading teams information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_OUTBREAK': '[言語] Read Outbreak',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_FOLLOW_UP_DESCRIPTION': '[言語] This permission allows reading contact follow-up information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_REPORT': '[言語] Read Report',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CONTACT_DESCRIPTION': '[言語] This permission allows creating/modifying/removing contact information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_WRITE_CASE_DESCRIPTION': '[言語] This permission allows creating/modifying/removing case information.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_SYS_CONFIG_DESCRIPTION': '[言語] This permission allows reading system configuration settings.',
        'LNG_ROLE_AVAILABLE_PERMISSIONS_READ_ROLE_DESCRIPTION': '[言語] This permission allows reading roles information.',

        /**
         * Reference Data
         */
        'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL': '[言語] Risk Level',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_INTENSITY': '[言語] Exposure Intensity',
        'LNG_REFERENCE_DATA_CATEGORY_GENDER': '[言語] Gender',
        'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_SAMPLE': '[言語] Type Of Sample',
        'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL': '[言語] Certainty Level',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_FREQUENCY': '[言語] Exposure Frequency',
        'LNG_REFERENCE_DATA_CATEGORY_STATUS': '[言語] Status',
        'LNG_REFERENCE_DATA_CATEGORY_LAB_NAME': '[言語] Lab Name',
        'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT': '[言語] Lab Test Result',
        'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION': '[言語] Context of Transmission',
        'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION': '[言語] Case Classification',
        'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_LAB_TEST': '[言語] Type Of Lab Result',
        'LNG_REFERENCE_DATA_CATEGORY_OCCUPATION': '[言語] Occupation',
        'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE': '[言語] Document Type',
        'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE': '[言語] Exposure Type',
        'LNG_REFERENCE_DATA_CATEGORY_DISEASE': '[言語] Disease',

        /**
         * Outbreak Templates
         */

        /**
         * Security Questions
         */
        'LNG_SECURITY_QUESTION_10': '[言語] In what town or city did you meet your spouse/partner?',
        'LNG_SECURITY_QUESTION_8': '[言語] What is the middle name of your oldest child?',
        'LNG_SECURITY_QUESTION_1': '[言語] What was your childhood nickname?',
        'LNG_SECURITY_QUESTION_2': '[言語] In what city or town did your mother and father meet?',
        'LNG_SECURITY_QUESTION_4': '[言語] What was your favorite sport in high school?',
        'LNG_SECURITY_QUESTION_9': '[言語] In what town or city was your first full time job?',
        'LNG_SECURITY_QUESTION_3': '[言語] What is your favorite team?',
        'LNG_SECURITY_QUESTION_5': '[言語] What was the house number and street name you lived in as a child?',
        'LNG_SECURITY_QUESTION_6': '[言語] What primary school did you attend?',
        'LNG_SECURITY_QUESTION_7': '[言語] What is your spouse or partner\'s mother\'s maiden name?'
    }
};
