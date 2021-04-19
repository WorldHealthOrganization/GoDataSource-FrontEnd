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
        'LNG_PAGE_DASHBOARD_CASE_SUMMARY_TITLE_DESCRIPTION': 'Determines the number of cases for the selected outbreak by case classification and ignoring the "not a case".',
        'LNG_PAGE_DASHBOARD_CASE_BY_GEOGRAPHIC_LOCATION_TITLE_DESCRIPTION': 'Determines the number of cases for the selected outbreak by location.',
        'LNG_PAGE_DASHBOARD_CASE_HOSPITALIZATION_TITLE_DESCRIPTION': 'Determines the number of cases currently hospitalised, currently isolated etc.',
        'LNG_PAGE_DASHBOARD_HISTOGRAM_CHAINS_OF_TRANSMISSION_SIZE_TITLE_DESCRIPTION': 'Determines the size of chains of transmission.',
        'LNG_PAGE_DASHBOARD_EPI_CURVE_TITLE_DESCRIPTION': '<div style=\'color: #FFF; padding-bottom: 10px\'>Epi Curve reports</div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Cases counts over time stratified by classification]</span> - Determines the number of cases over time stratified by classification.</div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Cases counts over time stratified by outcome]</span> - Determines the number of cases over time stratified by outcome.</div><div><span style=\'font-weight: bold;\'>[Cases counts over reporting time stratified by classification"]</span> - Determines the number of cases over reporting time stratified by classification.</div>',
        'LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_TITLE_DESCRIPTION': 'Determines the number of contacts based on their follow-up status.',
        'LNG_PAGE_DASHBOARD_CASES_CONTACT_STATUS_REPORT_TITLE_DESCRIPTION': 'Determines the number of cases based on their contact status.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_DECEASED_TITLE_DESCRIPTION': 'Determines the number of cases who have died.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_HOSPITALISED_TITLE_DESCRIPTION': 'Determines the number of cases currently hospitalised.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_LESS_CONTACTS_TITLE_BEFORE_VALUE_DESCRIPTION': 'Determines the number of cases with less than X contacts.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_NEW_PREVIOUS_DAYS_CONTACTS_BEFORE_VALUE_DESCRIPTION': 'Determines the proportion of new cases in the previous X days detected among known contacts.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_REFUSING_TREATMENT_TITLE_DESCRIPTION': 'Determines the number of suspect cases refusing to be transferred to a treatment unit.',
        'LNG_PAGE_DASHBOARD_KPI_NEW_CASES_PREVIOUS_DAYS_TRANSMISSION_CHAINS_BEFORE_VALUE_DESCRIPTION': 'Determines the proportion of new cases in the previous X days in known transmission chains.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_PENDING_LAB_RESULT_DESCRIPTION': 'Determines the number of suspect cases where the lab result is pending.',
        'LNG_PAGE_DASHBOARD_KPI_CASES_NOT_IDENTIFIED_THROUGH_CONTACTS_DESCRIPTION': 'Determines the number of cases who are not identified though known contact list.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEAN_TITLE_DESCRIPTION': 'Determines the mean number of contacts per case.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_PER_CASE_MEDIAN_TITLE_DESCRIPTION': 'Determines the median number of contacts per case.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_FOLLOWUP_LIST_TITLE_DESCRIPTION': 'Determines the number of contacts on follow-up list.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_LOST_TO_FOLLOW_UP_DESCRIPTION': 'Determines the number of contacts who are lost to follow-up.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NOT_SEEN_TITLE_BEFORE_VALUE_DESCRIPTION': 'Determines the number of contacts not seen in X days.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE_DESCRIPTION': 'Determines the number of contacts becoming cases over time and place.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_SEEN_EACH_DAY_DESCRIPTION': 'Determines the number of contacts seen each day.',
        'LNG_PAGE_DASHBOARD_KPI_CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP_DESCRIPTION': 'Determines the proportion of contacts successfully followed-up each day.',
        'LNG_PAGE_DASHBOARD_KPI_INDEPENDENT_TRANSMISSION_CHAINS_DESCRIPTION': 'Determines the number of independent chains of transmission.',
        'LNG_PAGE_DASHBOARD_KPI_ACTIVE_CHAINS_DESCRIPTION': 'Determines the number of active chains of transmission.',
        'LNG_PAGE_DASHBOARD_KPI_NEW_CHAINS_OF_TRANSMISSION_FROM_REGISTERED_CONTACTS_WHO_BECAME_CASES_DESCRIPTION': 'Determines the number of new chains of transmission from registered contacts who have become cases.',

        /**
         * uiOutbreakFields
         */
        'LNG_OUTBREAK_FIELD_LABEL_MAP_SERVER_TYPE_DESCRIPTION': '<div style=\'color: #FFF; padding-bottom: 10px\'>Specify the layer source of the REST service for this layer of map information. If you leave this blank when creating an outbreak, the system will default to using WHO\'s source layer.</div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Tile - TileArcGISRest]</span> - Layer source that provide pre-rendered, tiled images in grids that are organized by zoom levels for specific resolutions.</div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Tile - XYZ]</span> - Layer source for tile data with URLs in a set XYZ format that are defined in a URL template. By default, this follows the widely-used Google grid where x 0 and y 0 are in the top left. Grids like TMS where x 0 and y 0 are in the bottom left can be used by using the {-y} placeholder in the URL template, so long as the source does not have a custom tile grid.</div><div><span style=\'font-weight: bold;\'>[VectorTile - VectorTileLayer]</span> - Layer source for vector tile data that is rendered client-side.</div>',
        'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION': '<div style="color: #FFF; padding-bottom: 10px"><span style="font-weight: bold;">[Option 1]</span> - If Team1 has "Argentina" assigned and Team2 has "Buenos Aires" assigned (sublocation of Argentina). Contact has "Buenos Aires" as the usual place of residence location. Only Team2 will be added to the assignment pool from where the choosing will be done.</div><div style="padding-bottom: 10px"><span style="font-weight: bold;">[Option 2]</span> - If Team1 has "Argentina" assigned and team2 has "Buenos Aires" assigned (sublocation of Argentina). Contact has "Buenos Aires" as the usual place of residence location. Both Team1 and Team2 will be added to the assignment pool from where the choosing will be done.</div>',

        /**
         * uiImportData
         */
        'LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS_DESCRIPTION': '<div style=\'padding-bottom: 10px\'><span style=\'color: #770000; font-weight: bold;\'>[Pending]:</span><span> this field has not been completely loaded and mapped yet (please click on the \'Map sub-options\' button)</span></div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Complete no / total]:</span><span> the number of values that have been mapped out of the total number of distinct values in the input file, this information is useful if you decide not to map everything, or to check that nothing is missed</span></div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Complete:]</span><span> all file options are mapped and ready for import</span></div><div style=\'padding-bottom: 10px\'><span style=\'color: #770000; font-weight: bold;\'>[Incomplete no / total]:</span><span> the number of invalid values that are present out of the total number of distinct mapped values in the input file</span></div><div style=\'padding-bottom: 10px\'><span style=\'color: #770000; font-weight: bold;\'>[Handled above]:</span><span> a mapping already provided to the system for another field in this import is applicable here also and has been reused</span></div><div style=\'padding-bottom: 10px\'><span style=\'font-weight: bold;\'>[Completed above]:</span><span> a mapping already provided to the system for another field in this import is applicable here also and has been reused globally for all valid fields</span></div>',

        /**
         * uiContactOfContactFields
         */
        'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION': 'Location',

        /**
         * NEW GROUP
         * uiDatePickerCalendar
         */
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_SUNDAY': 'Su',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_MONDAY': 'Mo',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_TUESDAY': 'Tu',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_WEDNESDAY': 'We',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_THURSDAY': 'Th',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_FRIDAY': 'Fr',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_NARROW_SATURDAY': 'Sa',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_SUNDAY': 'Sunday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_MONDAY': 'Monday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_TUESDAY': 'Tuesday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_WEDNESDAY': 'Wednesday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_THURSDAY': 'Thursday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_FRIDAY': 'Friday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_LONG_SATURDAY': 'Saturday',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_SUNDAY': 'Sun',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_MONDAY': 'Mon',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_TUESDAY': 'Tue',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_WEDNESDAY': 'Wed',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_THURSDAY': 'Thu',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_FRIDAY': 'Fri',
        'LNG_DATEPICKER_CALENDAR_LABEL_WEEK_DAYS_SHORT_SATURDAY': 'Sat',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JANUARY': 'Jan',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_FEBRUARY': 'Feb',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_MARCH': 'Mar',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_APRIL': 'Apr',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_MAY': 'May',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JUNE': 'Jun',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_JULY': 'Jul',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_AUGUST': 'Aug',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_SEPTEMBER': 'Sep',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_OCTOBER': 'Oct',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_NOVEMBER': 'Nov',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_NARROW_DECEMBER': 'Dec',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JANUARY': 'January',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_FEBRUARY': 'February',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_MARCH': 'March',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_APRIL': 'April',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_MAY': 'May',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JUNE': 'June',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_JULY': 'July',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_AUGUST': 'August',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_SEPTEMBER': 'September',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_OCTOBER': 'October',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_NOVEMBER': 'November',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_LONG_DECEMBER': 'December',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JANUARY': 'Jan',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_FEBRUARY': 'Feb',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_MARCH': 'Mar',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_APRIL': 'Apr',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_MAY': 'May',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JUNE': 'Jun',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_JULY': 'Jul',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_AUGUST': 'Aug',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_SEPTEMBER': 'Sep',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_OCTOBER': 'Oct',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_NOVEMBER': 'Nov',
        'LNG_DATEPICKER_CALENDAR_LABEL_MONTH_NAMES_SHORT_DECEMBER': 'Dec',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_1': '1',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_2': '2',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_3': '3',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_4': '4',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_5': '5',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_6': '6',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_7': '7',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_8': '8',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_9': '9',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_10': '10',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_11': '11',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_12': '12',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_13': '13',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_14': '14',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_15': '15',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_16': '16',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_17': '17',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_18': '18',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_19': '19',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_20': '20',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_21': '21',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_22': '22',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_23': '23',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_24': '24',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_25': '25',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_26': '26',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_27': '27',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_28': '28',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_29': '29',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_30': '30',
        'LNG_DATEPICKER_CALENDAR_LABEL_DATE_NAMES_31': '31'



        /**
         * REMOVE the tokens from below
         */
        // ...
    }
};
