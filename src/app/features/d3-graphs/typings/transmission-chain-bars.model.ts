import { CaseBarModel } from './case-bar.model';

export interface TransmissionChainBarsModel {
    casesMap: {
        [uid: string]: CaseBarModel
    };
    caseIds: string[];
    relationships: {
        [sourceUid: string]: string[]
    };
    minGraphDate: string;
    maxGraphDate: string;
}
