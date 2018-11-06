export enum DashboardKpiGroup {
    CASE = 'case',
    CONTACT = 'contact',
    TRANSMISSION_CHAIN = 'transmission-chain'
}

export enum DashboardDashlet {
    // cases
    CASES_DECEASED = 'cases-deceased',
    CASES_HOSPITALISED = 'cases-hospitalised',
    CASES_WITH_LESS_THAN_X_CONTACTS = 'cases-with-less-than-x-contacts',
    SUSPECT_CASES_REFUSING_TO_BE_TRANSFERRED_TO_A_TREATMENT_UNIT = 'suspect-cases-refusing-to-be-transferred-to-a-treatment-unit',
    NEW_CASES_IN_THE_PREVIOUS_X_DAYS_AMONG_KNOWN_CONTACTS = 'new-cases-in-the-previous-x-days-among-known-contacts',
    NEW_CASES_IN_THE_PREVIOUS_X_DAYS_IN_KNOWN_TRANSMISSION_CHAINS = 'new-cases-in-the-previous-x-days-in-known-transmission-chains',
    SUSPECT_CASES_WITH_PENDING_LAB_RESULT = 'suspect-cases-with-pending-lab-result',
    CASES_NOT_IDENTIFIED_THROUGH_CONTACTS = 'cases-not-identified-through-contacts',

    // contacts
    CONTACTS_PER_CASE_MEAN = 'contacts-per-case-mean',
    CONTACTS_PER_CASE_MEDIAN = 'contacts-per-case-median',
    CONTACTS_ON_THE_FOLLOW_UP_LIST = 'contacts-on-the-follow-up-list',
    CONTACTS_LOST_TO_FOLLOW_UP = 'contacts-lost-to-follow-up',
    CONTACTS_NOT_SEEN_IN_X_DAYS = 'contacts-not-seen-in-x-days',
    CONTACTS_BECOMING_CASES_IN_TIME_AND_SPACE = 'contacts-becoming-cases-in-time-and-space',
    CONTACTS_SEEN_EACH_DAY = 'contacts-seen-each-day',
    CONTACTS_WITH_SUCCESSFUL_FOLLOW_UP = 'contacts-with-successful-follow-up',

    // transmission chains
    INDEPENDENT_TRANSMISSION_CHAINS = 'independent-transmission-chains',
    ACTIVE_TRANSMISSION_CHAINS = 'active-transmission-chains',
    TRANSMISSION_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES = 'transmission-chains-from-contacts-who-became-cases'
}
