export interface CaseBarModel {
    id: string;
    visualId?: string;
    dateOfOnset: string;
    addresses?: {
        // #TODO we may need location name
        locationId: string,
        date: string
    }[];
    dateRanges?: {
        typeId: string;
        startDate: string;
        endDate: string;
        // #TODO we may need location name
        locationId: string;
    }[];
    labResults?: {
        dateSampleTaken: string;
        testType: string;
        result: string;
    }[];
    firstGraphDate: string;
    lastGraphDate: string;
}
