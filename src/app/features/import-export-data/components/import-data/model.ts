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
        translate: (string) => string,
        fieldsWithoutTokens: {
            [property: string]: string
        } = {}
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

        // recursive add value pair
        const createImportableLabelValuePair = (
            result: ImportableLabelValuePair[],
            impLVPair: ImportableLabelValuePair,
            labelPrefix: string = ''
        ) => {
            // if this is a string property then we can push it as it is
            if (_.isString(impLVPair.label)) {
                // add parent prefix to child one
                impLVPair.label = labelPrefix + translate(
                    fieldsWithoutTokens[impLVPair.value] ?
                        fieldsWithoutTokens[impLVPair.value] :
                        impLVPair.label
                );

                // add to list of filters to which we can push data
                result.push(impLVPair);

            // otherwise we need to map it to multiple values
            } else if (_.isObject(impLVPair.label)) {
                // add as parent drop-down as well
                // NO NEED FOR NOW, since back-end doesn't have this implementation anymore

                // add child options
                let parentTokenLabel: string = fieldsWithoutTokens[impLVPair.value] ? fieldsWithoutTokens[impLVPair.value] : '';
                parentTokenLabel = parentTokenLabel ? translate(parentTokenLabel) : parentTokenLabel;
                labelPrefix += parentTokenLabel ? parentTokenLabel + ' => ' : '';
                _.each(impLVPair.label, (token: string, prop: string) => {
                    // //fieldsWithoutTokens
                    createImportableLabelValuePair(
                        result,
                        new ImportableLabelValuePair(
                            token,
                            impLVPair.value + '.' + prop
                        ),
                        labelPrefix
                    );
                });
            }
        };

        // map properties to array of objects
        // generate current list of properties ( & convert objects to to prop : value )
        // add object properties that be either a parent drop-down or child drop-down with children of its own
        this.modelPropertiesKeyValue = _.chain(this.modelProperties)
            .map((tokenLabel: string, property: string) => {
                return new ImportableLabelValuePair(
                    tokenLabel,
                    property
                );
            })
            .transform((result: ImportableLabelValuePair[], value: ImportableLabelValuePair) => {
                createImportableLabelValuePair(result, value);
            }, [])
            .sortBy((item: { label: string }) => {
                // this is already translated
                return item.label;
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

    public readonly: boolean = false;

    public destinationLevel: number[] = [0, 0, 0];

    constructor(
        public destinationField: string = null,
        public sourceField: string = null
    ) {}
}