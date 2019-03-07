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
    } = {})
    {
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
    } = {})
    {
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
    readonly: boolean;
    mappingKey: string;
    mappingData: SavedImportField[];

    constructor(data: {
        id?: string,
        name?: string,
        isPublic?: boolean,
        readonly?: boolean,
        mappingData?: SavedImportField[]
    }) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.mappingKey= _.get(data, 'mappingKey');
        this.isPublic = _.get(data, 'isPublic', false);
        this.readonly = _.get(data, 'readonly', false);
        this.mappingData = _.get(data, 'mappingData', []);
    }
}
