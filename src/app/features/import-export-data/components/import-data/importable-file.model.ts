import * as _ from 'lodash';

export class ImportableFilePropertiesModel {
    [modelProperty: string]: string | ImportableFilePropertiesModel
}

export class ImportableFilePropertyValuessModel {
    [modelProperty: string]: {
        id: string;
        value: string;
        label: string;
    } | ImportableFilePropertyValuessModel
}


export class ImportableFileModel {
    id: string;
    fileHeaders: string[] = [];

    suggestedFieldMapping: {
        [fileHeader: string]: string
    };

    modelProperties: ImportableFilePropertiesModel;

    modelPropertyValues: ImportableFilePropertyValuessModel;

    distinctFileColumnValues: {
        [fileHeader: string]: string[]
    };

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.fileHeaders = _.get(data, 'fileHeaders', []);
        this.modelProperties = _.get(data, 'modelProperties', {});
        this.modelPropertyValues = _.get(data, 'modelPropertyValues', {});
        this.suggestedFieldMapping = _.get(data, 'suggestedFieldMapping', {});
        this.distinctFileColumnValues = _.get(data, 'distinctFileColumnValues', {});
    }
}
