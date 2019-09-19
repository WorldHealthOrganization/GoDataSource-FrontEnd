import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

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
    modelPropertyValuesMap: {
        [modelProperty: string]: ImportableFilePropertyValuesModel
    } = {};

    distinctFileColumnValues: {
        [fileHeader: string]: string[]
    };
    distinctFileColumnValuesKeyValue: {
        [fileHeader: string]: ImportableLabelValuePair[]
    };

    /**
     * Fix issue with lodash not supporting _.get(a, 'aaa[].b'), since it tries to interpret [] as an array
     * @param object
     * @param path
     * @returns {value | undefined} Undefined if not found ( just like _.get )
     */
    static lodashCustomGet(
        object: any,
        path: string
    ): any {
        // validate input object
        if (
            _.isEmpty(object) ||
            _.isEmpty(path)
        ) {
            return undefined;
        }

        // go through the path
        const pathSplit = path.split('.');
        _.each(pathSplit, (pathItem: string) => {
            // retrieve next value
            object = object[pathItem] !== undefined ?
                object[pathItem] :
                _.get(object, pathItem);

            // not found
            if (object === undefined) {
                // stop each
                return false;
            }
        });

        // finished return found value
        return object;
    }

    constructor(
        data = null,
        translate: (string) => string,
        fieldsWithoutTokens: {
            [property: string]: string
        } = {},
        excludeDestinationProperties: {
            [property: string]: boolean
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
            .value() as ImportableLabelValuePair[];

        // recursive add value pair
        const createImportableLabelValuePair = (
            result: ImportableLabelValuePair[],
            impLVPair: ImportableLabelValuePair,
            labelPrefix: string = ''
        ) => {
            // if this is a string property then we can push it as it is
            if (_.isString(impLVPair.label)) {
                if (!excludeDestinationProperties[impLVPair.value]) {
                    // add parent prefix to child one
                    impLVPair.label = labelPrefix + translate(
                        fieldsWithoutTokens[impLVPair.value] ?
                            fieldsWithoutTokens[impLVPair.value] :
                            impLVPair.label
                    );

                    // map destination field for easy access to mapped options when having [] in path
                    this.modelPropertyValuesMap[impLVPair.value] = ImportableFileModel.lodashCustomGet(
                        this.modelPropertyValues,
                        impLVPair.value
                    );

                    // add to list of filters to which we can push data
                    result.push(impLVPair);
                }
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
            .value() as ImportableLabelValuePair[];

        this.distinctFileColumnValuesKeyValue = {};
        _.each(this.distinctFileColumnValues, (values: string[], property: string) => {
            // sanitize property
            property = property.replace(/\[\d+]$/g, '');
            property = property.replace(/\[\d+\]/g, '[]');

            // set distinct values
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

export interface IMappedOption {
    id: string;
    sourceOption?: string;
    destinationOption?: string;
    readOnly?: boolean;
}

export class ImportableMapField {
    public mappedOptions: IMappedOption[] = [];

    private _readOnlyValues: {
        [id: string]: LabelValuePair[]
    } = {};

    public readonly: boolean = false;

    public sourceDestinationLevel: number[] = [0, 0, 0];

    public id: string;

    public isSourceArray: boolean = false;
    private _sourceField: string = null;
    public sourceFieldWithoutIndexes = null;
    set sourceField(value: string) {
        this._sourceField = value;

        // strip [] from teh end since we shouldn't have this case
        this.sourceFieldWithoutIndexes = this.sourceField ? this.sourceField.replace(/\[\d+]$/g, '') : null;
        // replace array items with general ...
        this.sourceFieldWithoutIndexes = this.sourceFieldWithoutIndexes ? this.sourceFieldWithoutIndexes.replace(/\[\d+\]/g, '[]') : this.sourceFieldWithoutIndexes;

        this.isSourceArray = this.sourceField ? this.sourceField.indexOf('[]') > -1 : false;
        this.checkNumberOfMaxLevels();
    }
    get sourceField(): string {
        return this._sourceField;
    }

    public isDestinationArray: boolean = false;
    private _destinationField: string = null;
    set destinationField(value: string) {
        this._destinationField = value;
        this.isDestinationArray = this.destinationField ? this.destinationField.indexOf('[]') > -1 : false;
        this.checkNumberOfMaxLevels();
    }
    get destinationField(): string {
        return this._destinationField;
    }

    numberOfMaxLevels: any[] = [];

    constructor(
        destinationField: string = null,
        sourceField: string = null
    ) {
        this.id = uuid();
        this.destinationField = destinationField;
        this.sourceField = sourceField;
    }

    checkNumberOfMaxLevels() {
        const sourceArray: any[] = this.sourceField ?
            ( this.sourceField.match(/\[\]/g) || [] ) :
            [];
        const destinationArray: any[] = this.destinationField ?
            ( this.destinationField.match(/\[\]/g) || [] ) :
            [];
        this.numberOfMaxLevels = sourceArray.length < destinationArray.length ? destinationArray : sourceArray;
    }

    public getOptionsForReadOnlySource(option: IMappedOption): LabelValuePair[] {
        // if not readonly, then there is no point in constructing a list of label / values since it should exist in the main dropdown options
        if (!option.readOnly) {
            return [];
        }

        // do we need to init / reinit the options ?
        if (
            !this._readOnlyValues[option.id] ||
            this._readOnlyValues[option.id][0].value !== option.sourceOption
        ) {
            this._readOnlyValues[option.id] = [
                new LabelValuePair(
                    option.sourceOption,
                    option.sourceOption
                )
            ];
        }

        // finished
        return this._readOnlyValues[option.id];
    }
}
