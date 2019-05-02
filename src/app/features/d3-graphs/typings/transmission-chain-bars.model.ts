import { EntityBarModel } from './entity-bar.model';

export interface TransmissionChainBarsModel {
    personsMap: {
        [uid: string]: EntityBarModel
    };
    personsOrder: string[];
    relationships: {
        [sourceUid: string]: string[]
    };
    minGraphDate: string;
    maxGraphDate: string;
}
