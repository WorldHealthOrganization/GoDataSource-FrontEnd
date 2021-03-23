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
         * REMOVE the tokens from below
         */
        // ...
    }
};
