import * as _ from 'lodash';

export class ImportableLabelValuePair {
    constructor(
        public label: string,
        public value: string
    ) {}
}

export class ImportableFilePropertiesModel {
    [modelProperty: string]: string | ImportableFilePropertiesModel
}

export class ImportableFilePropertyValuesModel {
    [modelProperty: string]: {
        id: string;
        label: string;
    } | ImportableFilePropertyValuesModel
}


export class ImportableFileModel {
    id: string;
    fileHeaders: string[] = [];
    fileHeadersKeyValue: ImportableLabelValuePair[];

    suggestedFieldMapping: {
        [fileHeader: string]: string
    };

    modelProperties: ImportableFilePropertiesModel;
    modelPropertiesKeyValue:  ImportableLabelValuePair[];

    modelPropertyValues: ImportableFilePropertyValuesModel;

    distinctFileColumnValues: {
        [fileHeader: string]: string[]
    };
    distinctFileColumnValuesKeyValue: {
        [fileHeader: string]: ImportableLabelValuePair[]
    };

    constructor(
        data = null,
        translate: (string) => string = null
    ) {
        this.id = _.get(data, 'id');
        this.fileHeaders = _.get(data, 'fileHeaders', []);
        this.modelProperties = _.get(data, 'modelProperties', {});
        this.modelPropertyValues = _.get(data, 'modelPropertyValues', {});
        this.suggestedFieldMapping = _.get(data, 'suggestedFieldMapping', {});
        this.distinctFileColumnValues = _.get(data, 'distinctFileColumnValues', {});

        this.fileHeadersKeyValue = _.chain(this.fileHeaders)
            .map((value: string) => {
                return new ImportableLabelValuePair(
                    value,
                    value
                );
            })
            .sortBy((item: { label: string }) => {
                return item.label;
            })
            .value();

        this.modelPropertiesKeyValue = _.chain(this.modelProperties)
            .map((tokenLabel: string, property: string) => {
                return new ImportableLabelValuePair(
                    tokenLabel,
                    property
                );
            })
            .filter((item) => _.isString(item.label))
            .sortBy((item: { label: string }) => {
                return translate ? translate(item.label) : item.label;
            })
            .value();

        this.distinctFileColumnValuesKeyValue = {};
        _.each(this.distinctFileColumnValues, (values: string[], property: string) => {
            this.distinctFileColumnValuesKeyValue[property] = _.map(
                values,
                (value: string) => {
                    return new ImportableLabelValuePair(
                        value,
                        value
                    );
                }
            );
        });
    }
}

export class ImportableMapField {
    public mappedOptions: {
        sourceOption?: string;
        destinationOption?: string;
    }[] = [];

    constructor(
        public destinationField: string = null,
        public sourceField: string = null
    ) {}
}
