import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

export enum ImportDataExtension {
    CSV = '.csv',
    XLS = '.xls',
    XLSX = '.xlsx',
    XML = '.xml',
    ODS = '.ods',
    JSON = '.json',
    ZIP = '.zip'
}

export interface IModelArrayProperties {
    maxItems: number;
}

export interface IFileArrayProperties {
    maxItems: number;
}

export class ImportableLabelValuePair {
    constructor(
        public label: string,
        public value: string,
        public tooltip?: string
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
    // file id
    readonly id: string;

    // file headers
    readonly fileHeaders: string[] = [];

    // file headers - label / value pair
    readonly fileHeadersKeyValue: ImportableLabelValuePair[];

    // file array headers - used to handle array headers
    readonly fileArrayHeaders: {
        [headerPathName: string]: IFileArrayProperties
    };

    // API - suggested field mappings
    readonly suggestedFieldMapping: {
        [fileHeader: string]: string
    };

    // model properties
    readonly modelProperties: ImportableFilePropertiesModel;

    // model properties - key value pair
    readonly modelPropertiesKeyValue: ImportableLabelValuePair[];

    // model properties - key value map
    readonly modelPropertiesKeyValueMap: {
        [value: string]: string
    };

    // model property values
    readonly modelPropertyValues: ImportableFilePropertyValuesModel;
    readonly modelPropertyValuesMap: {
        [modelProperty: string]: {
            id: string;
            label: string;
        }[]
    } = {};
    readonly modelPropertyValuesMapChildMap: {
        [modelProperty: string]: {
            [value: string]: string
        }
    };

    // index for easy access
    readonly modelPropertyValuesMapIndex: {
        [modelProperty: string]: {
            [modelPropertyIndexKey: string]: string
        }
    } = {};

    // model array properties - questionnaires
    readonly modelArrayProperties: {
        [propertyPath: string]: IModelArrayProperties
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

    /**
     * Constructor
     */
    constructor(
        data = null,
        translate: (string) => string,
        fileType: ImportDataExtension,
        fieldsWithoutTokens: {
            [property: string]: string
        } = {},
        excludeDestinationProperties: {
            [property: string]: boolean
        } = {},
        extraDataUsedToFormatData: any,
        formatDataBeforeUse: (
            modelProperties: ImportableFilePropertiesModel,
            modelPropertyValues: ImportableFilePropertyValuesModel,
            fieldsWithoutTokens: {
                [property: string]: string
            },
            suggestedFieldMapping: {
                [fileHeader: string]: string
            },
            modelArrayProperties: {
                [propertyPath: string]: IModelArrayProperties
            },
            fileType: ImportDataExtension,
            extraDataUsedToFormat: any
        ) => void
    ) {
        // file id
        this.id = _.get(data, 'id');

        // file headers
        this.fileHeaders = (_.get(data, 'fileHeaders') || []).map((value: any) => {
            return typeof value === 'string' ? value : value.toString();
        });

        // file array headers
        this.fileArrayHeaders = _.get(data, 'fileArrayHeaders') || [];

        // model properties
        this.modelProperties = _.get(data, 'modelProperties', {});
        this.modelPropertyValues = _.get(data, 'modelPropertyValues', {});

        // suggested mappings
        this.suggestedFieldMapping = _.get(data, 'suggestedFieldMapping', {});

        // model array properties
        this.modelArrayProperties = _.get(data, 'modelArrayProperties', {});

        // format response
        if (formatDataBeforeUse) {
            formatDataBeforeUse(
                this.modelProperties,
                this.modelPropertyValues,
                fieldsWithoutTokens,
                this.suggestedFieldMapping,
                this.modelArrayProperties,
                fileType,
                extraDataUsedToFormatData
            );
        }

        // map file headers
        this.fileHeadersKeyValue = _.chain(this.fileHeaders)
            .map((value: string) => {
                return new ImportableLabelValuePair(
                    value,
                    value,
                    value
                );
            })
            .sortBy((item: { label: string }) => {
                return item.label;
            })
            .value() as ImportableLabelValuePair[];

        // recursive add value pair
        const modelPropertyValuesMapIndex: {
            [modelProperty: string]: {
                [modelPropertyIndexKey: string]: string
            }
        } = {};
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

                    // indexes
                    modelPropertyValuesMapIndex[impLVPair.value] = {};
                    _.each(this.modelPropertyValuesMap[impLVPair.value], (propValue) => {
                        // label
                        if (propValue.label) {
                            // label translated
                            modelPropertyValuesMapIndex[impLVPair.value][_.camelCase(translate(propValue.label)).toLowerCase()] = propValue.id;

                            // label not translated (LNG key)
                            modelPropertyValuesMapIndex[impLVPair.value][_.camelCase(propValue.label).toLowerCase()] = propValue.id;
                        }

                        // id
                        modelPropertyValuesMapIndex[impLVPair.value][_.camelCase(propValue.id).toLowerCase()] = propValue.id;
                    });

                    // add tooltip
                    impLVPair.tooltip = impLVPair.label;

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

        // map modelPropertiesKeyValue for easy access
        this.modelPropertiesKeyValueMap = {};
        this.modelPropertiesKeyValue.forEach((item) => {
            this.modelPropertiesKeyValueMap[item.value] = item.label;
        });

        // map modelPropertyValuesMap for easy access
        this.modelPropertyValuesMapChildMap = {};
        _.each(
            this.modelPropertyValuesMap,
            (items, modelProperty) => {
                // no need to continue ?
                if (!items) {
                    return;
                }

                // init
                this.modelPropertyValuesMapChildMap[modelProperty] = {};
                items.forEach((item) => {
                    this.modelPropertyValuesMapChildMap[modelProperty][item.id] = translate(item.label);
                });
            }
        );

        // clean empty indexes
        this.modelPropertyValuesMapIndex = {};
        _.each(modelPropertyValuesMapIndex, (indexValues, indexKey) => {
            // jump over ?
            if (_.isEmpty(indexValues)) {
                return;
            }

            // index it
            this.modelPropertyValuesMapIndex[indexKey] = indexValues;
        });
    }
}

// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// NEED TO CLEANUP ABOVE AFTER FINISH
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// + CLEANUP
// + CLEANUP
// + CLEANUP
// + CLEANUP
// + CLEANUP
// + CLEANUP
// + CLEANUP
// + CLEANUP


/**
 * Import field option
 */
export interface IMappedOption {
    id: string;
    parentId: string;
    sourceOption?: string;
    destinationOption?: string;
    readOnly?: boolean;
}

/**
 * Import field
 */
export class ImportableMapField {
    // unique identifier
    id: string;

    // mapped options
    mappedOptions: IMappedOption[] = [];
    mappedOptionsCollapsed: boolean = true;

    // read-only values
    private _readOnlyValues: {
        [id: string]: LabelValuePair[]
    } = {};

    // item is readonly (required fields) ?
    readonly: boolean = false;

    // source & destination array indexes
    private _sourceDestinationLevel: number[] = [0, 0, 0];

    // used to know how many level selects to render (we need an array of string because we use *ngFor and not for(i=0; i<=numberOfMaxLevels))
    private _numberOfMaxLevels: string[] = [];
    get numberOfMaxLevels(): string[] {
        return this._numberOfMaxLevels;
    }

    // array indexes formatted for display
    private _sourceDestinationLevelForDisplay: string;
    get sourceDestinationLevelForDisplay(): string {
        return this._sourceDestinationLevelForDisplay;
    }

    // source destination levels are valid ?
    private _sourceDestinationLevelAreValid: boolean = true;
    get sourceDestinationLevelAreValid(): boolean {
        return this._sourceDestinationLevelAreValid;
    }

    // source contains array indexes ?
    private _isSourceArray: boolean = false;
    get isSourceArray(): boolean {
        return this._isSourceArray;
    }

    // destination contains array indexes ?
    private _isDestinationArray: boolean = false;
    get isDestinationArray(): boolean {
        return this._isDestinationArray;
    }

    // remove any index data for easy match for distinct values
    private _sourceFieldWithoutIndexes: string = null;
    get sourceFieldWithoutIndexes(): string {
        return this._sourceFieldWithoutIndexes;
    }

    // source with selected indexes
    private _sourceFieldWithSelectedIndexes: string;
    get sourceFieldWithSelectedIndexes(): string {
        return this._sourceFieldWithSelectedIndexes;
    }

    // source field
    private _sourceField: string = null;
    set sourceField(value: string) {
        // set source value
        this._sourceField = value;

        // strip [] from the end since we shouldn't have this case
        this._sourceFieldWithoutIndexes = this.sourceField ? this.sourceField.replace(/\[\d+]$/g, '') : null;

        // replace array items with general ...
        this._sourceFieldWithoutIndexes = this.sourceFieldWithoutIndexes ? this.sourceFieldWithoutIndexes.replace(/\[\d+\]/g, '[]') : this.sourceFieldWithoutIndexes;

        // determine if source contains array index ?
        this._isSourceArray = this.sourceField ? this.sourceField.indexOf('[]') > -1 : false;

        // determine number of max levels
        this.checkNumberOfMaxLevels();

        // format array of indexes
        this.formatArrayIndexes();
    }
    get sourceField(): string {
        return this._sourceField;
    }

    // destination field
    private _destinationField: string = null;
    set destinationField(value: string) {
        // set destination value
        this._destinationField = value;

        // determine if destination contains array index ?
        this._isDestinationArray = this.destinationField ? this.destinationField.indexOf('[]') > -1 : false;

        // determine number of max levels
        this.checkNumberOfMaxLevels();

        // format array of indexes
        this.formatArrayIndexes();
    }
    get destinationField(): string {
        return this._destinationField;
    }

    /**
     * Constructor
     */
    constructor(
        destinationField: string = null,
        sourceField: string = null
    ) {
        // generate unique id
        this.id = uuid();

        // set source & destination
        this.destinationField = destinationField;
        this.sourceField = sourceField;
    }

    /**
     * Determine number of max levels (max(source & destination))
     */
    private checkNumberOfMaxLevels(): void {
        // source
        const sourceArray: any[] = this.sourceField ?
            ( this.sourceField.match(/\[\]/g) || [] ) :
            [];

        // destination
        const destinationArray: any[] = this.destinationField ?
            ( this.destinationField.match(/\[\]/g) || [] ) :
            [];

        // determine number of max levels
        this._numberOfMaxLevels = sourceArray.length < destinationArray.length ? destinationArray : sourceArray;
    }

    /**
     * Get options
     */
    getOptionsForReadOnlySource(option: IMappedOption): LabelValuePair[] {
        // if not readonly, then there is no point in constructing a list of label / values since it should exist in the main dropdown options
        if (!option.readOnly) {
            return [];
        }

        // do we need to init / re-init the options ?
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

    /**
     * Format array of indexes
     */
    private formatArrayIndexes(): void {
        // no point in continuing ?
        this._sourceDestinationLevelAreValid = true;
        this._sourceDestinationLevelForDisplay = '';
        this._sourceFieldWithSelectedIndexes = this.sourceField;
        if (
            !this.sourceField || (
                !this.isSourceArray &&
                !this.isDestinationArray
            )
        ) {
            return;
        }

        // add indexes
        this._numberOfMaxLevels.forEach((value, index) => {
            // check level validity
            if (
                this._sourceDestinationLevel[index] === undefined ||
                this._sourceDestinationLevel[index] === null
            ) {
                // invalid value
                this._sourceDestinationLevelAreValid = false;

                // there is no point in continuing since we have invalid value
                return;
            }

            // add to key
            this._sourceFieldWithSelectedIndexes += this._sourceDestinationLevel[index];

            // format array indexes
            this._sourceDestinationLevelForDisplay += `${this._sourceDestinationLevelForDisplay ? ' - ' : ''}${this._sourceDestinationLevel[index] + 1}`;
        });

        // invalid ?
        if (!this._sourceDestinationLevelAreValid) {
            this._sourceDestinationLevelForDisplay = '-';
        }
    }

    /**
     * Set source destination level
     */
    setSourceDestinationLevel(
        index: number,
        value: number
    ): void {
        // update value
        this._sourceDestinationLevel[index] = value;

        // format array of indexes
        this.formatArrayIndexes();
    }

    /**
     * Set source destination level
     */
    setSourceDestinationLevels(sourceDestinationLevel: number[]): void {
        // update values
        this._sourceDestinationLevel = sourceDestinationLevel;

        // format array of indexes
        this.formatArrayIndexes();
    }

    /**
     * We should clone the result since the value should be immutable, since every change should go through setSourceDestinationLevel
     */
    getSourceDestinationLevels(): number[] {
        return this._sourceDestinationLevel;
    }

    /**
     * Implemented this way since _sourceDestinationLevel should be immutable
     */
    getSourceDestinationLevel(index: number): number {
        return this._sourceDestinationLevel[index];
    }
}
