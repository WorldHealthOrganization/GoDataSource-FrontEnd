import * as _ from 'lodash';

export class SavedImportField {
    source: string;
    destination: string;
    options: SavedImportOption[];
    levels: number[];

    constructor(data: {
        source?: string,
        destination?: string,
        options?: SavedImportOption[],
        levels?: number[]
    } = {}) {
        Object.assign(
            this,
            data
        );
    }
}

export class SavedImportOption {
    source: string;
    destination: string;

    constructor(data: {
        source?: string,
        destination?: string
    } = {}) {
        Object.assign(
            this,
            data
        );
    }
}

export class SavedImportMappingModel {
    id: string;
    name: string;
    isPublic: boolean;
    readOnly: boolean;
    mappingKey: string;
    mappingData: SavedImportField[];

    constructor(data: {
        id?: string,
        name?: string,
        isPublic?: boolean,
        readOnly?: boolean,
        mappingKey?: string,
        mappingData?: SavedImportField[]
    }) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.isPublic = _.get(data, 'isPublic', false);
        this.readOnly = _.get(data, 'readOnly', false);
        this.mappingKey = _.get(data, 'mappingKey');
        this.mappingData = _.get(data, 'mappingData', []);
    }
}
