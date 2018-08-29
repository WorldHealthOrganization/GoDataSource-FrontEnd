export class ImportableFileModel {
    id: string;
    fileHeaders: string[];
    suggestedFieldMapping: {
        [fileHeader: string]: string
    };
    modelProperties: {
        [modelProperty: string]: string[]
    };
    modelPropertyValues: {
        [modelProperty: string]: string[]
    };
    distinctFileColumnValues: {
        [fileHeader: string]: string[]
    };
}
