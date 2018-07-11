
export class Constants {
    // default display constants
    static DEFAULT_DATE_DISPLAY_FORMAT = 'MM/dd/yyy';

    // Gender
    static GENDER = {
        MALE: {
            label: 'Male',
            value: 'Male'
        },
        FEMALE: {
            label: 'Female',
            value: 'Female'
        }
    };

    // #TODO replace with Reference Data
    static CASE_CLASSIFICATION = {
        SUSPECT: {
            label: 'Suspect',
            value: 'Suspect'
        },
        CONFIRMED: {
            label: 'Confirmed',
            value: 'Confirmed'
        }
    };

    // #TODO replace with Reference Data
    static CASE_RISK_LEVEL = {
        LOW: {
            label: 'low',
            value: 'low'
        },
        MEDIUM: {
            label: 'medium',
            value: 'medium'
        },
        HIGH: {
            label: 'high',
            value: 'high'
        }
    };

    // #TODO replace with Reference Data
    static DOCUMENT_TYPE = {
        PASSPORT: {
            label: 'passport',
            value: 'passport'
        },
        NATIONAL_ID: {
            label: 'nationalId',
            value: 'nationalId'
        },
        EXTERNAL_ID: {
            label: 'externalId',
            value: 'externalId'
        }
    };

    // #TODO replace with Reference Data
    static DISEASE = {
        EBOLA: {
            label: 'Ebola',
            value: 'Ebola'
        },
        PLAGUE: {
            label: 'Plague',
            value: 'Plague'
        },
        CHOLERA: {
            label: 'Cholera',
            value: 'Cholera'
        },
        YELLOW_FEVER: {
            label: 'Yellow Fever',
            value: 'Yellow Fever'
        }
    };

    // #TODO replace with Reference Data
    // #TODO add the whole list of countries
    static COUNTRY = {
        ALGERIA: {
            label: 'Algeria',
            value: 'Algeria'
        },
        CAMEROON: {
            label: 'Cameroon',
            value: 'Cameroon'
        },
        CONGO: {
            label: 'Congo',
            value: 'Congo'
        },
        ETHIOPIA: {
            label: 'Ethiopia',
            value: 'Ethiopia'
        },
        MADAGASCAR: {
            label: 'Madagascar',
            value: 'Madagascar'
        },
        NIGERIA: {
            label: 'Nigeria',
            value: 'Nigeria'
        },
        UGANDA: {
            label: 'Uganda',
            value: 'Uganda'
        },
        SUDAN: {
            label: 'Sudan',
            value: 'Sudan'
        }
    };

    // #TODO replace with Reference Data
    static ACTIVE_OPTIONS = {
        ALL: {
            label: 'ALL',
            value: ''
        },
        YES: {
            label: 'YES',
            value: true
        },
        NO: {
            label: 'NO',
            value: false
        }

    };

    // #TODO replace with Reference Data
    static CERTAINTY_LEVEL_OPTIONS = {
        1: {
            label: 'Low',
            value: 1
        },
        2: {
            label: 'Medium',
            value: 2
        },
        3: {
            label: 'High',
            value: 3
        }
    };

    // #TODO replace with Reference Data
    static EXPOSURE_TYPE_OPTIONS = {
        1: {
            label: 'Direct physical contact',
            value: 1
        },
        2: {
            label: 'Slept / Ate / Spend time in the same household',
            value: 2
        },
        3: {
            label: 'Touched body fluids',
            value: 3
        },
        4: {
            label: 'Touched / Shared linens / clothes / dishes',
            value: 4
        }
    };

    // #TODO replace with Reference Data
    static EXPOSURE_FREQUENCY_OPTIONS = {
        1: {
            label: '1 - 5 times',
            value: 1
        },
        2: {
            label: '6 - 10 times',
            value: 2
        },
        3: {
            label: '11 - 20 times',
            value: 3
        },
        4: {
            label: 'Over 21 times',
            value: 4
        },
        5: {
            label: 'Unknown',
            value: 5
        }
    };

    // #TODO replace with Reference Data
    static EXPOSURE_DURATION_OPTIONS = {
        1: {
            label: 'Under 2 hours',
            value: 1
        },
        2: {
            label: '2 days',
            value: 2
        },
        3: {
            label: 'Unknown',
            value: 3
        }
    };

    // #TODO replace with Reference Data
    static SOCIAL_RELATIONSHIP_OPTIONS = {
        MOTHER: {
            label: 'Mother',
            value: 'mother'
        },
        FATHER: {
            label: 'Father',
            value: 'father'
        },
        BROTHER: {
            label: 'Brother',
            value: 'brother'
        }
    };
}
