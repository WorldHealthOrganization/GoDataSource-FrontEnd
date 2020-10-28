import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { environment } from '../../../../../environments/environment';
import { IMappedOption, IModelArrayProperties, ImportableFileModel, ImportableFilePropertiesModel, ImportableFilePropertyValuesModel, ImportableLabelValuePair, ImportableMapField, ImportDataExtension } from './model';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton, HoverRowAction } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { NgForm, NgModel } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { v4 as uuid } from 'uuid';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FormSelectChangeDetectionPushComponent } from '../../../../shared/components/form-select-change-detection-push/form-select-change-detection-push.component';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import {
    DialogButton, DialogComponent,
    DialogConfiguration, DialogField,
    DialogFieldType
} from '../../../../shared/components/dialog/dialog.component';
import {
    SavedImportField, SavedImportMappingModel,
    SavedImportOption
} from '../../../../core/models/saved-import-mapping.model';
import { Observable } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { MatDialogRef } from '@angular/material';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeStyle } from '@angular/platform-browser/src/security/dom_sanitization_service';
import { HoverRowActionsDirective } from '../../../../shared/directives/hover-row-actions/hover-row-actions.directive';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

export enum ImportServerModelNames {
    CASE_LAB_RESULTS = 'labResult',
    CONTACT_LAB_RESULTS = 'labResult',
    REFERENCE_DATA = 'referenceData',
    LOCATION = 'location',
    OUTBREAK = 'outbreak',
    RELATIONSHIPS = 'relationship',
    CASE = 'case',
    CONTACT = 'contact',
    CONTACT_OF_CONTACT = 'contactOfContact'
}

enum ImportServerErrorCodes {
    DUPLICATE_RECORD = 11000,
    INVALID_VISUAL_ID_MASK = 'INVALID_VISUAL_ID_MASK',
    DUPLICATE_VISUAL_ID = 'DUPLICATE_VISUAL_ID',
    ADDRESS_MUST_HAVE_USUAL_PLACE_OF_RESIDENCE = 'ADDRESS_MUST_HAVE_USUAL_PLACE_OF_RESIDENCE',
    ADDRESS_MULTIPLE_USUAL_PLACE_OF_RESIDENCE = 'ADDRESS_MULTIPLE_USUAL_PLACE_OF_RESIDENCE',
    ADDRESS_PREVIOUS_PLACE_OF_RESIDENCE_MUST_HAVE_DATE = 'ADDRESS_PREVIOUS_PLACE_OF_RESIDENCE_MUST_HAVE_DATE'
}

@Component({
    selector: 'app-import-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.less']
})
export class ImportDataComponent
    implements OnInit, OnDestroy {
    /**
     * Extension mapped to mimes
     */
    private allowedMimeTypes: string[] = [];
    private allowedMimeTypesMap = {
        [ImportDataExtension.CSV]: 'text/csv',
        [ImportDataExtension.XLS]: 'application/vnd.ms-excel',
        [ImportDataExtension.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        [ImportDataExtension.XML]: 'text/xml',
        [ImportDataExtension.ODS]: 'application/vnd.oasis.opendocument.spreadsheet',
        [ImportDataExtension.JSON]: 'application/json',
        [ImportDataExtension.ZIP]: [
            'application/x-zip-compressed',
            'application/zip',
            'multipart/x-zip'
        ]
    };

    /**
     * Allowed extensions
     */
    private _allowedExtensions: string[];
    @Input() set allowedExtensions(extensions: string[]) {
        this._allowedExtensions = extensions;

        this.translationData.types = this.allowedExtensions.join(', ');

        this.allowedMimeTypes = _.transform(this.allowedExtensions, (acc, extension: string) => {
            if (this.allowedMimeTypesMap[extension]) {
                if (_.isArray(this.allowedMimeTypesMap[extension])) {
                    acc.push(...this.allowedMimeTypesMap[extension]);
                } else {
                    acc.push(this.allowedMimeTypesMap[extension]);
                }
            } else {
                acc.push(extension);
            }
        }, []);

        if (this.uploader) {
            this.uploader.options.allowedMimeType = this.allowedMimeTypes;
        }
    }

    get allowedExtensions(): string[] {
        return this._allowedExtensions ? this._allowedExtensions : [];
    }

    /**
     * Page title
     */
    @Input() title: string = '';

    /**
     * Tell system if this doesn't need to go through map step, uploading file is enough
     */
    @Input() isOneStep: boolean = false;

    /**
     * Model provided to import for input
     */
    private _model: string = undefined;
    @Input() set model(value: string) {
        this._model = value;
        if (this.uploader) {
            this.uploader.options.additionalParameter.model = this._model;
        }
    }

    get model(): string {
        return this._model;
    }

    /**
     * Saved import mapping
     */
    @Input() savedImportPage: string;

    /**
     * List with saved import mappings
     */
    savedMappingsList$: Observable<SavedImportMappingModel[]>;

    // loaded saved import mapping
    loadedImportMapping: SavedImportMappingModel;

    /**
     * File uploader
     */
    uploader: FileUploader;

    /**
     * Cursor is over drag-drop file zone
     */
    hasFileOver: boolean = false;

    /**
     * Variables sent to translation pipe
     */
    translationData: {
        types?: string
    } = {};

    /**
     * Percent displayed when uploading a file
     */
    progress: number = null;

    /**
     * Display spinner when True, otherwise display the form
     */
    private _displayLoading: boolean = false;
    private _displayLoadingLocked: boolean = false;

    @Input() set displayLoading(value: boolean) {
        if (!this._displayLoadingLocked) {
            this._displayLoading = value;
        }
    }

    get displayLoading(): boolean {
        return this._displayLoading;
    }

    /**
     * Import success message
     */
    @Input() importSuccessMessage: string = 'LNG_PAGE_IMPORT_DATA_SUCCESS_MESSAGE';

    // finished - imported data with success
    /**
     * Event called when we finished importing data ( this should handle page redirect )
     */
    @Output() finished = new EventEmitter<void>();

    /**
     * Where should we POST mapped data to ( endpoint that imports data )
     */
    @Input() importDataUrl: string;

    /**
     * Endpoint to upload file ( & get header columns and other data )
     */
    private _importFileUrl: string;
    @Input() set importFileUrl(value: string) {
        this._importFileUrl = value;

        if (this.uploader) {
            this.uploader.options.url = `${environment.apiUrl}/${this.importFileUrl}`;
        }
    }

    get importFileUrl(): string {
        return this._importFileUrl;
    }

    /**
     * Tokens for properties for which we don't receive labels from the server
     */
    @Input() fieldsWithoutTokens: {
        [property: string]: string
    } = {};

    /**
     * Address fields should use outbreak locations ?
     */
    @Input() useOutbreakLocations: boolean = false;

    /**
     * Address fields so we can use custom dropdowns
     */
    @Input() addressFields: {
        [property: string]: boolean
    } = {};

    /**
     * Record properties that shouldn't be visible in destination dropdown
     */
    @Input() excludeDestinationProperties: {
        [property: string]: boolean
    } = {};

    /**
     * Required fields that user needs to map
     */
    private requiredDestinationFieldsMap: {
        [modelProperty: string]: true
    } = {};
    private _requiredDestinationFields: string[] = [];
    @Input() set requiredDestinationFields(value: string[]) {
        this._requiredDestinationFields = value;
        this.requiredDestinationFieldsMap = {};
        _.each(value, (v: string) => {
            this.requiredDestinationFieldsMap[v] = true;
        });
    }

    get requiredDestinationFields(): string[] {
        return this._requiredDestinationFields;
    }

    /**
     * Alis under which we upload the file
     */
    @Input() fileUploadAlias: string;

    /**
     * Data to send to format callback
     */
    @Input() extraDataUsedToFormatData: any;

    /**
     * Callback called after we receive model definitions from api
     *  - through this callback we can alter the api response
     */
    @Input() formatDataBeforeUse: (
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
    ) => void;

    /**
     * Keep all file data ( header columns, module information, drop-down options etc )
     */
    importableObject: ImportableFileModel;

    /**
     * Source / Destination level value
     */
    possibleSourceDestinationLevels: LabelValuePair[];

    /**
     * Mapped fields
     */
    mappedFields: ImportableMapField[] = [];

    /**
     * Mapped fields for reset
     */
    initialImportMapping: ImportableMapField[] = [];

    /**
     * Keep err msg details
     */
    errMsgDetails: {
        details: {
            failed: {
                // used internally
                showData: boolean,

                // from server
                data: {
                    file: {
                        [prop: string]: any
                    },
                    save: {
                        [prop: string]: any
                    }
                },
                recordNo: number,
                message: string,
                error: {
                    code: number,
                    message: string,
                    errmsg: string,
                    details: {
                        codes: {
                            [property: string]: any
                        }
                    }
                }
            }[]
        }
    };

    /**
     * Constants / Classes
     */
    Object = Object;
    ImportServerErrorCodes = ImportServerErrorCodes;

    /**
     * Decrypt password
     */
    decryptPassword: string;

    /**
     * Decrypt password alias
     */
    @Input() decryptPasswordAlias: string = 'decryptPassword';





    // scrollable viewport
    @ViewChild('virtualScrollViewport') virtualScrollViewport: CdkVirtualScrollViewport;

    // table data max height
    importDataBodyRowsMaxHeight: SafeStyle = undefined;

    // mapped data table element
    @ViewChild('mappedDataTable') mappedDataTable: ElementRef;

    // element that is editable now
    elementInEditMode: ImportableMapField | IMappedOption;

    // check if map fields are visible
    get areMapFieldVisible(): boolean {
        return !this.displayLoading &&
            this.importableObject &&
            !this.errMsgDetails;
    }

    // hover table row actions
    recordActions: HoverRowAction[] = [
        // Add
        new HoverRowAction({
            icon: 'addCircle',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_ADD_NEW_FIELD_OPTION',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return (item instanceof ImportableMapField) &&
                    this.importableObject.distinctFileColumnValuesKeyValue &&
                    this.importableObject.distinctFileColumnValuesKeyValue[item.sourceFieldWithoutIndexes] && (
                        !!this.importableObject.modelPropertyValuesMap[item.destinationField] ||
                        this.addressFields[item.destinationField]
                    ) &&
                    item.mappedOptions.length < this.importableObject.distinctFileColumnValuesKeyValue[item.sourceFieldWithoutIndexes].length;
            },
            click: (
                item: ImportableMapField,
                handler: HoverRowActionsDirective
            ) => {
                this.addNewOptionMap(
                    item,
                    handler
                );
            }
        }),

        // Clone
        new HoverRowAction({
            icon: 'fileCopy',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_CLONE',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return item instanceof ImportableMapField;
            },
            click: (
                item: ImportableMapField,
                handler: HoverRowActionsDirective,
                index: number
            ) => {
                this.cloneFieldMap(
                    item,
                    handler,
                    index
                );
            }
        }),

        // Modify
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_MODIFY',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return this.elementInEditMode !== item;
            },
            click: (
                item: ImportableMapField | IMappedOption,
                handler: HoverRowActionsDirective
            ) => {
                this.editItem(
                    item,
                    handler
                );
            }
        }),

        // Cancel Modify
        new HoverRowAction({
            icon: 'close',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_CANCEL',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return this.elementInEditMode === item;
            },
            click: (
                item: ImportableMapField | IMappedOption,
                handler: HoverRowActionsDirective
            ) => {
                // clear
                this.clearElementInEditMode();

                // force hover row rerender
                handler.hoverRowActionsComponent.hideEverything();
            }
        }),

        // Remove
        new HoverRowAction({
            icon: 'delete',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_REMOVE',
            class: 'icon-item-delete',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return !(item instanceof ImportableMapField) ||
                    !item.readonly;
            },
            click: (
                item: ImportableMapField | IMappedOption,
                handler: HoverRowActionsDirective,
                index: number
            ) => {
                this.removeItemMap(
                    item,
                    index
                );
            }
        })
    ];

    // job schedule handler
    private scheduleJob: NodeJS.Timer;
    private determineTableDataMaxHeightJob: NodeJS.Timer;

    // used to determine duplicate selections
    usedSourceFields: {
        [source: string]: number
    } = {};

    /**
     * Constructor
     * @param snackbarService
     * @param authDataService
     * @param dialogService
     * @param i18nService
     * @param formHelper
     * @param importExportDataService
     */
    constructor(
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private formHelper: FormHelperService,
        private importExportDataService: ImportExportDataService,
        private savedImportMappingService: SavedImportMappingService,
        private domSanitizer: DomSanitizer
    ) {
        // fix mime issue - browser not supporting some of the mimes, empty was provided to mime Type which wasn't allowing user to upload teh files
        if (!(FileLikeObject.prototype as any)._createFromObjectPrev) {
            (FileLikeObject.prototype as any)._createFromObjectPrev = FileLikeObject.prototype._createFromObject;
            FileLikeObject.prototype._createFromObject = (file: File) => {
                (FileLikeObject.prototype as any)._createFromObjectPrev({
                    size: file.size,
                    type: file.type ?
                        file.type : (
                            file.name && file.name.lastIndexOf('.') > -1 ? (
                                    _.isArray(this.allowedMimeTypesMap[file.name.substr(file.name.lastIndexOf('.')).toLowerCase()]) ?
                                        this.allowedMimeTypesMap[file.name.substr(file.name.lastIndexOf('.')).toLowerCase()][0] :
                                        this.allowedMimeTypesMap[file.name.substr(file.name.lastIndexOf('.')).toLowerCase()]
                                ) :
                                ''
                        ),
                    name: file.name
                });
            };
        }
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get saved import mapping
        this.getImportMappings();

        // init array levels
        this.possibleSourceDestinationLevels = [];
        for (let level = 0; level < 100; level++) {
            this.possibleSourceDestinationLevels.push(new LabelValuePair(
                (level + 1).toString(),
                level
            ));
        }

        // init uploader
        this.uploader = new FileUploader({
            allowedMimeType: this.allowedMimeTypes,
            authToken: this.authDataService.getAuthToken(),
            url: `${environment.apiUrl}/${this.importFileUrl}`,
            additionalParameter: {},
            itemAlias: this.fileUploadAlias
        });

        // don't allow multiple files to be added
        // we could set queueLimit to 1, but we won't be able to replace the file that way
        this.uploader.onAfterAddingAll = (files: any[]) => {
            if (files.length > 1) {
                // display error
                this.displayError('LNG_PAGE_IMPORT_DATA_ERROR_ONLY_ONE_FILE_CAN_BE_ATTACHED');

                // remove all items
                this.uploader.clearQueue();
            }
        };

        // don't allow multiple files to be uploaded
        // we could set queueLimit to 1, but we won't be able to replace the file that way
        this.uploader.onAfterAddingFile = () => {
            // check if we need to replace existing item
            if (this.uploader.queue.length > 1) {
                // remove old item
                this.uploader.removeFromQueue(this.uploader.queue[0]);
            }
        };

        // handle errors when trying to upload files
        this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any) => {
            switch (filter.name) {
                case 'mimeType':
                    // display error
                    this.displayError('LNG_PAGE_IMPORT_DATA_ERROR_FILE_NOT_SUPPORTED');
                    break;
                default:
                    // display error
                    this.displayError('LNG_PAGE_IMPORT_DATA_ERROR_DEFAULT_ATTACH');
            }
        };

        // handle server errors
        this.uploader.onErrorItem = (file, err: any) => {
            // display toast
            try {
                err = _.isObject(err) ? err : JSON.parse(err);
                err = err.error ? err.error : err;
                this.snackbarService.showApiError(err);

                // hide loading
                this._displayLoading = false;
                this._displayLoadingLocked = false;
                this.progress = null;
            } catch (e) {
                // display error
                this.displayError(
                    'LNG_PAGE_IMPORT_DATA_ERROR_PROCESSING_FILE',
                    true
                );
            }
        };

        // handle before upload preparation
        this.uploader.onBeforeUploadItem = () => {
            // add model only if necessary
            if (this._model) {
                this.uploader.options.additionalParameter.model = this._model;
            }

            // decrypt password
            if (this.decryptPassword) {
                this.uploader.options.additionalParameter[this.decryptPasswordAlias] = this.decryptPassword;
            } else {
                delete this.uploader.options.additionalParameter[this.decryptPasswordAlias];
            }
        };

        // handle file upload progress
        this.uploader.onProgressItem = (fileItem: FileItem, progress: any) => {
            this.progress = Math.round(progress);
        };

        // everything went smoothly ?
        this.uploader.onCompleteItem = (item: FileItem, response: string, status: number) => {
            // an error occurred ?
            if (status !== 200) {
                return;
            }

            // we finished with one steppers
            if (this.isOneStep) {
                // display success
                this.snackbarService.showSuccess(
                    this.importSuccessMessage,
                    this.translationData
                );

                // emit finished event - event should handle redirect
                this.finished.emit();
            } else {
                // we should get a ImportableFileModel object
                let jsonResponse;
                try {
                    jsonResponse = JSON.parse(response);
                } catch {
                }
                if (
                    !response ||
                    !jsonResponse
                ) {
                    this.displayError(
                        'LNG_PAGE_IMPORT_DATA_ERROR_INVALID_RESPONSE_FROM_SERVER',
                        true
                    );
                    return;
                }

                // determine what kind of file did we import
                let fileType: ImportDataExtension;
                if (
                    item.file.rawFile &&
                    (item.file.rawFile as any).type
                ) {
                    const mimeToFind: string = (item.file.rawFile as any).type.toLowerCase();
                    fileType = _.findKey(
                        this.allowedMimeTypesMap,
                        (mimes: string | string[]) => {
                            if (_.isString(mimes)) {
                                return mimes.toLowerCase() === mimeToFind;
                            } else {
                                let found: boolean = false;
                                (mimes || []).forEach((mime: string) => {
                                    if (mime.toLowerCase() === mimeToFind) {
                                        found = true;
                                        return false;
                                    }
                                });
                                return found;
                            }
                        }
                    ) as ImportDataExtension;
                }

                // construct importable file object
                this.importableObject = new ImportableFileModel(
                    jsonResponse,
                    (token: string): string => {
                        return this.i18nService.instant(token);
                    },
                    fileType,
                    this.fieldsWithoutTokens,
                    this.excludeDestinationProperties,
                    this.extraDataUsedToFormatData,
                    this.formatDataBeforeUse
                );

                // we should have at least the headers of the file
                if (this.importableObject.fileHeaders.length < 1) {
                    this.importableObject = null;

                    this.displayError(
                        'LNG_PAGE_IMPORT_DATA_ERROR_INVALID_HEADERS',
                        true
                    );

                    return;
                }

                // determine height of table rows ?
                this.determineTableDataMaxHeight();

                // start schedule job
                this.runDataScheduleJob();

                // required fields
                const mapOfRequiredDestinationFields = this.requiredDestinationFieldsMap ? _.clone(this.requiredDestinationFieldsMap) : {};

                // do some multilevel mappings
                interface IMappedHeader {
                    value: string;
                    level?: number;
                    subLevel?: number;
                }
                const mappedHeaders: {
                    [key: string]: IMappedHeader[]
                } = {};
                _.each(this.importableObject.fileHeaders, (fHeader: string) => {
                    // determine if this is a multi level header
                    const fHeaderMultiLevelData = /\s\[((MD)|(MV))\s+(\d+)\]$/g.exec(fHeader);
                    let mapKey: string;
                    let level: number;
                    let fHeaderWithoutMultiLevel: string = fHeader;
                    let addValue: boolean = true;
                    if (fHeaderMultiLevelData) {
                        // value / date ?
                        fHeaderWithoutMultiLevel = fHeader.substring(0, fHeaderMultiLevelData.index);
                        mapKey = fHeaderMultiLevelData[1] === 'MD' ?
                            `${fHeaderWithoutMultiLevel}.${this.i18nService.instant('LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_DATE')}` :
                            `${fHeaderWithoutMultiLevel}.${this.i18nService.instant('LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_VALUE')}`;

                        // set level
                        level = _.parseInt(fHeaderMultiLevelData[4]) - 1;

                        // no need to add value anymore
                        addValue = false;
                    } else {
                        mapKey = fHeader;
                    }

                    // add to mapped headers
                    let mapKeyCamelCase: string = _.camelCase(mapKey).toLowerCase();
                    if (!mappedHeaders[mapKeyCamelCase]) {
                        mappedHeaders[mapKeyCamelCase] = [];
                    }

                    // add the new option
                    mappedHeaders[mapKeyCamelCase].push({
                        value: fHeader,
                        level: level
                    });

                    // add an extra map containing value since it might be a questionnaire answer
                    let mapKeyCamelCaseWithValue: string;
                    if (addValue) {
                        mapKeyCamelCaseWithValue = _.camelCase(`${mapKey}.${this.i18nService.instant('LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_VALUE')}`).toLowerCase();
                        if (!mappedHeaders[mapKeyCamelCaseWithValue]) {
                            mappedHeaders[mapKeyCamelCaseWithValue] = [];
                        }

                        // add the new option
                        mappedHeaders[mapKeyCamelCaseWithValue].push({
                            value: fHeader,
                            level: level
                        });
                    }


                    // do we need to add a more shorter version for determining headers ?
                    // strip option numbers
                    const stripEndingNumbers = /\s(\d+)$/g.exec(fHeaderWithoutMultiLevel);
                    if (stripEndingNumbers) {
                        // determine sub-level
                        const subLevel: number = _.parseInt(stripEndingNumbers[1]) - 1;

                        // remove index value
                        mapKey = fHeaderWithoutMultiLevel.substring(0, stripEndingNumbers.index);
                        mapKeyCamelCase = _.camelCase(mapKey).toLowerCase();
                        mapKeyCamelCaseWithValue = _.camelCase(`${mapKey}.${this.i18nService.instant('LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_VALUE')}`).toLowerCase();

                        // determine if we need to add this one
                        let canAdd: boolean = true;
                        if (!mappedHeaders[mapKeyCamelCaseWithValue]) {
                            mappedHeaders[mapKeyCamelCaseWithValue] = [];
                        }
                        if (!mappedHeaders[mapKeyCamelCase]) {
                            mappedHeaders[mapKeyCamelCase] = [];
                        } else {
                            canAdd = !_.find(mappedHeaders[mapKeyCamelCase], {
                                value: fHeader,
                                level: _.isNumber(level) ? level : subLevel,
                                subLevel: _.isNumber(level) ? subLevel : undefined
                            });
                        }

                        // push the new possible map option
                        if (canAdd) {
                            mappedHeaders[mapKeyCamelCase].push({
                                value: fHeader,
                                level: _.isNumber(level) ? level : subLevel,
                                subLevel: _.isNumber(level) ? subLevel : undefined
                            });

                            // add value
                            mappedHeaders[mapKeyCamelCaseWithValue].push({
                                value: fHeader,
                                level: _.isNumber(level) ? level : subLevel,
                                subLevel: _.isNumber(level) ? subLevel : undefined
                            });
                        }
                    }
                });

                // push new mapped field
                let foundModel: ImportableMapField;
                const pushNewMapField = (
                    destination: string,
                    sourceData: IMappedHeader[],
                    overwriteLevel?: number,
                    ignoreArrayLevels?: boolean
                ) => {
                    // map all file levels
                    (sourceData || []).forEach((source: IMappedHeader) => {
                        // determine map level
                        const level: number = overwriteLevel !== undefined ? overwriteLevel : (
                            source.level !== undefined ?
                                source.level :
                                0
                        );

                        // check identical maps...
                        foundModel = _.find(this.mappedFields, (mappedItem: ImportableMapField) => {
                            return mappedItem.destinationField === destination &&
                                mappedItem.sourceField === source.value &&
                                mappedItem.getSourceDestinationLevel(0) === level;
                        });

                        // ignore identical maps
                        if (foundModel) {
                            return;
                        }

                        // allow other kinda.. duplicate maps that need to be solved by user
                        // this should work for options mapping..in case you want to map different options from different properties
                        // NOTHING

                        // create new possible map item
                        const importableItem = new ImportableMapField(
                            destination,
                            source.value
                        );

                        // add options if necessary
                        this.addMapOptionsIfNecessary(importableItem);

                        // do we need to make this one readonly ?
                        if (mapOfRequiredDestinationFields[importableItem.destinationField]) {
                            importableItem.readonly = true;
                            delete mapOfRequiredDestinationFields[importableItem.destinationField];
                        }

                        // check if we need to set levels
                        importableItem.setSourceDestinationLevel(
                            0,
                            level
                        );
                        importableItem.setSourceDestinationLevel(
                            1,
                            source.subLevel !== undefined ?
                                source.subLevel :
                                0
                        );

                        // add to list
                        this.mappedFields.push(importableItem);

                        // add file array maps
                        const arrayPathIndex: number = source.value.lastIndexOf('[]');
                        const arrayPath: string = arrayPathIndex < 0 ? null : source.value.substring(0, arrayPathIndex);
                        if (
                            !ignoreArrayLevels &&
                            destination &&
                            arrayPath &&
                            this.importableObject &&
                            this.importableObject.fileArrayHeaders[arrayPath] &&
                            this.importableObject.fileArrayHeaders[arrayPath].maxItems > 1
                        ) {
                            for (let newLevel: number = 1; newLevel < this.importableObject.fileArrayHeaders[arrayPath].maxItems; newLevel++) {
                                pushNewMapField(
                                    destination,
                                    [source],
                                    newLevel,
                                    true
                                );
                            }
                        }
                    });

                    // add model array maps
                    if (
                        !ignoreArrayLevels &&
                        destination &&
                        this.importableObject &&
                        this.importableObject.modelArrayProperties[destination] &&
                        this.importableObject.modelArrayProperties[destination].maxItems > 1
                    ) {
                        for (let newLevel: number = 1; newLevel < this.importableObject.modelArrayProperties[destination].maxItems; newLevel++) {
                            pushNewMapField(
                                destination,
                                sourceData,
                                newLevel,
                                true
                            );
                        }
                    }
                };

                // map file headers with model properties
                const mapToHeaderFile = (
                    value: string | ImportableFilePropertiesModel,
                    property: string,
                    parentPath: string = ''
                ) => {
                    // if object we need to go further into it
                    if (_.isObject(value)) {
                        _.each(value, (childValue: string | ImportableFilePropertiesModel, childProperty: string) => {
                            mapToHeaderFile(
                                childValue,
                                childProperty,
                                _.isObject(childValue) ? `${parentPath}.${childProperty}` : parentPath
                            );
                        });
                    } else {
                        // found the language tokens
                        let mappedHeaderObj: IMappedHeader[];
                        if (
                            (mappedHeaderObj = mappedHeaders[_.camelCase(`${parentPath}.${this.i18nService.instant(value)}`).toLowerCase()]) ||
                            (mappedHeaderObj = mappedHeaders[_.camelCase(`${parentPath}.${property}`).toLowerCase()]) ||
                            (mappedHeaderObj = mappedHeaders[_.camelCase(`${parentPath}.${value}`).toLowerCase()])
                        ) {
                            pushNewMapField(
                                `${parentPath}.${property}`,
                                mappedHeaderObj
                            );
                        } else {
                            // NOT FOUND
                            // check if parent key should be translated
                            const parentPrefixIndex: number = parentPath ? parentPath.lastIndexOf('.') : -1;
                            const parentPrefix = parentPrefixIndex > -1 ? parentPath.substring(0, parentPrefixIndex) : null;
                            const parentPathTranslation: string = this.fieldsWithoutTokens && this.fieldsWithoutTokens[parentPath] !== undefined ?
                                (this.fieldsWithoutTokens[parentPath] ? this.i18nService.instant(this.fieldsWithoutTokens[parentPath]) : '') :
                                undefined;
                            if (
                                parentPath &&
                                parentPathTranslation !== undefined && (
                                    (
                                        parentPathTranslation &&
                                        (mappedHeaderObj = mappedHeaders[_.camelCase(`${parentPathTranslation}[].${this.i18nService.instant(value)}`).toLowerCase()])
                                    ) || (
                                        parentPrefix &&
                                        (mappedHeaderObj = mappedHeaders[_.camelCase(
                                            `${parentPrefix}${parentPathTranslation !== '' ? ('.' + parentPathTranslation + '[]') : ''}.${this.i18nService.instant(value)}`
                                        ).toLowerCase()])
                                    )
                                )
                            ) {
                                pushNewMapField(
                                    `${parentPath}.${property}`,
                                    mappedHeaderObj
                                );

                            // search though flat values - for arrays
                            } else if (
                                mappedHeaders[_.camelCase(`${parentPath}.${this.i18nService.instant(value)}[1]`).toLowerCase()] ||
                                mappedHeaders[_.camelCase(`${this.i18nService.instant(value)}[1]`).toLowerCase()] || (
                                    parentPathTranslation !== undefined &&
                                    parentPrefix &&
                                    mappedHeaders[_.camelCase(
                                        `${parentPrefix}${parentPathTranslation !== '' ? ('.' + parentPathTranslation + '[]') : ''}.${this.i18nService.instant(value)}[1]`
                                    ).toLowerCase()]
                                )
                            ) {
                                // map all determined levels
                                _.each(
                                    this.possibleSourceDestinationLevels,
                                    (supportedLevel: LabelValuePair) => {
                                        if (
                                            (mappedHeaderObj = mappedHeaders[_.camelCase(`${parentPath}.${this.i18nService.instant(value)}[${this.i18nService.instant(supportedLevel.label)}]`).toLowerCase()]) ||
                                            (mappedHeaderObj = mappedHeaders[_.camelCase(`${this.i18nService.instant(value)}[${this.i18nService.instant(supportedLevel.label)}]`).toLowerCase()]) || (
                                                parentPathTranslation !== undefined &&
                                                parentPrefix &&
                                                (mappedHeaderObj = mappedHeaders[_.camelCase(
                                                    `${parentPrefix}${parentPathTranslation !== '' ? ('.' + parentPathTranslation + '[]') : ''}.${this.i18nService.instant(value)}[${this.i18nService.instant(supportedLevel.label)}]`
                                                ).toLowerCase()])
                                            )
                                        ) {
                                            // create object
                                            pushNewMapField(
                                                `${parentPath}.${property}`,
                                                mappedHeaderObj,
                                                supportedLevel.value
                                            );
                                        } else {
                                            // there is no point going further
                                            return false;
                                        }
                                    }
                                );
                            } else {
                                // NOT FOUND
                                // can't map by flat property since they are too common
                                // e.g. start date ( fileHeader[startdate] === model[incubationdates[].startdate] )
                            }
                        }
                    }
                };

                // go through each property of the model and try to map it to a property from the imported file
                _.each(this.importableObject.modelProperties, (value: ImportableFilePropertiesModel, property: string) => {
                    if (_.isObject(value)) {
                        mapToHeaderFile(
                            value,
                            property,
                            property
                        );
                    } else {
                        // TOKEN
                        // ALREADY MAPPED BY SERVER
                    }
                });

                // populate deducted mappings
                _.each(this.importableObject.suggestedFieldMapping, (destinationField: string, sourceField: string) => {
                    // check identical maps...
                    foundModel = _.find(this.mappedFields, {
                        destinationField: destinationField,
                        sourceField: sourceField
                    });

                    // ignore identical maps
                    if (foundModel) {
                        return;
                    }

                    // create new possible map item
                    const importableItem = new ImportableMapField(
                        destinationField,
                        sourceField
                    );

                    // add options if necessary
                    this.addMapOptionsIfNecessary(importableItem);

                    // do we need to make this one readonly ?
                    if (mapOfRequiredDestinationFields[importableItem.destinationField]) {
                        importableItem.readonly = true;
                        delete mapOfRequiredDestinationFields[importableItem.destinationField];
                    }

                    // add to list
                    this.mappedFields.push(importableItem);
                });

                // do we still have required fields? then we need to add a field map for each one of them  to force user to enter data
                _.each(mapOfRequiredDestinationFields, (n: boolean, property: string) => {
                    // create
                    const importableItem = new ImportableMapField(
                        property
                    );

                    // make it readonly
                    importableItem.readonly = true;

                    // add to list
                    this.mappedFields.push(importableItem);
                });

                // save initial import mapping
                this.initialImportMapping = _.clone(this.mappedFields);

                // display form
                this._displayLoading = false;
                this._displayLoadingLocked = false;
                this.progress = null;
            }
        };
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        this.stopDataScheduleJob();
        this.stopTableDataMaxHeight();
    }

    /**
     * Get saved import mappings for specific page
     */
    getImportMappings() {
        const qb = new RequestQueryBuilder();

        // specify for what page we want to get the saved items
        qb.filter.where({
            mappingKey: {
                eq: this.savedImportPage
            }
        });

        this.savedMappingsList$ = this.savedImportMappingService.getImportMappingsList(qb);
    }

    /**
     * Add drop-downs for mapping a drop-down type options
     * @param importableItem
     * @param reInitOptions
     */
    addMapOptionsIfNecessary(
        importableItem: ImportableMapField,
        reInitOptions: boolean = true
    ) {
        // add all distinct source as items that we need to map
        importableItem.mappedOptions = reInitOptions ? [] : (importableItem.mappedOptions || []);

        // there is no point in setting mapped values if we  don't have to map something
        if (
            !this.importableObject.distinctFileColumnValuesKeyValue ||
            !this.importableObject.distinctFileColumnValuesKeyValue[importableItem.sourceFieldWithoutIndexes] ||
            !this.importableObject.modelPropertyValuesMap[importableItem.destinationField]
        ) {
            return;
        }

        // we CAN'T use _.get because importableItem.sourceField contains special chars [ / ] / .
        const distinctValues: ImportableLabelValuePair[] = this.importableObject.distinctFileColumnValuesKeyValue[importableItem.sourceFieldWithoutIndexes];
        _.each(distinctValues, (distinctVal: ImportableLabelValuePair) => {
            // check to see if we didn't map this value somewhere else already
            if (_.find(
                this.mappedFields,
                (item: ImportableMapField): boolean => {
                    if (
                        item.sourceFieldWithoutIndexes !== importableItem.sourceFieldWithoutIndexes ||
                        item.destinationField !== importableItem.destinationField
                    ) {
                        return false;
                    } else {
                        return !_.isEmpty(
                            _.find(
                                item.mappedOptions,
                                (option: { sourceOption: string }): boolean => {
                                    return option.sourceOption === distinctVal.value;
                                }
                            )
                        );
                    }
                }
            )) {
                // no need to continue since this option is already mapped
                return;
            }

            // create map option with source
            const mapOpt: IMappedOption = {
                id: uuid(),
                parentId: importableItem.id,
                sourceOption: distinctVal.value
            };

            // check if we can find a proper destination option
            const sourceOptReduced: string = _.camelCase(mapOpt.sourceOption).toLowerCase();
            const modelPropertyValues = this.importableObject.modelPropertyValuesMap[importableItem.destinationField];
            const destinationOpt: any = _.find(
                modelPropertyValues,
                (modelItem: { id: string, label: string }) => {
                    return sourceOptReduced === _.camelCase(this.i18nService.instant(modelItem.label)).toLowerCase() ||
                        sourceOptReduced === _.camelCase(modelItem.id).toLowerCase() ||
                        sourceOptReduced === _.camelCase(modelItem.label).toLowerCase();
                }
            );

            // found a possible destination field
            if (destinationOpt !== undefined) {
                mapOpt.destinationOption = destinationOpt.id;
            }

            // add option
            importableItem.mappedOptions.push(mapOpt);
        });
    }

    /**
     * Save an import mapping
     */
    saveImportMapping() {
        const createImportMapping = () => {
            this.dialogService
                .showInput(
                    new DialogConfiguration({
                        message: 'LNG_DIALOG_SAVE_MAPPING_IMPORTS_TITLE',
                        yesLabel: 'LNG_DIALOG_SAVE_MAPPING_IMPORTS_BUTTON',
                        required: true,
                        fieldsList: [
                            new DialogField({
                                name: 'mappingImportName',
                                placeholder: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_NAME',
                                description: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_NAME_DESCRIPTION',
                                required: true,
                                fieldType: DialogFieldType.TEXT,
                            }),
                            new DialogField({
                                name: 'isPublic',
                                placeholder: 'LNG_SAVED_IMPORT_MAPPING_FIELD_LABEL_IS_PUBLIC',
                                fieldType: DialogFieldType.BOOLEAN
                            })
                        ]
                    }), true)
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.savedImportMappingService.createImportMapping(new SavedImportMappingModel({
                            name: answer.inputValue.value.mappingImportName,
                            isPublic: answer.inputValue.value.isPublic,
                            mappingKey: this.savedImportPage,
                            mappingData: this.getMappedImportFieldsForSaving()
                        }))
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    return throwError(err);
                                })
                            )
                            .subscribe((data) => {
                                this.getImportMappings();

                                this.loadedImportMapping = new SavedImportMappingModel(data);

                                this.snackbarService.showSuccess(`LNG_PAGE_IMPORT_DATA_LOAD_SAVED_IMPORT_MAPPING_SUCCESS_MESSAGE`);
                            });
                    }
                });
        };
        // create / update?
        if (
            this.loadedImportMapping &&
            this.loadedImportMapping.id &&
            !this.loadedImportMapping.readOnly
        ) {
            this.dialogService
                .showConfirm(new DialogConfiguration({
                    message: 'LNG_DIALOG_SAVE_MAPPINGS_UPDATE_OR_CREATE_TITLE',
                    yesLabel: 'LNG_COMMON_BUTTON_UPDATE',
                    addDefaultButtons: true,
                    buttons: [
                        new DialogButton({
                            clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                            },
                            label: 'LNG_COMMON_BUTTON_CREATE'
                        })
                    ]
                }), {
                    mapping: this.loadedImportMapping.name
                })
                .subscribe((answer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        // update
                        this.savedImportMappingService.modifyImportMapping(
                            this.loadedImportMapping.id, {
                                mappingData: this.getMappedImportFieldsForSaving()
                            }
                        )
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    return throwError(err);
                                })
                            )
                            .subscribe((data) => {
                                this.getImportMappings();

                                // update import mapping
                                this.loadedImportMapping = new SavedImportMappingModel(data);
                                // display message
                                this.snackbarService.showSuccess('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE');
                            });
                    } else if (answer.button === DialogAnswerButton.Extra_1) {
                        createImportMapping();
                    }
                });
        } else {
            createImportMapping();
        }
    }

    /**
     * Reset import mapping to initial values
     */
    resetImportMapping() {
        this.mappedFields = _.clone(this.initialImportMapping);
        this.loadedImportMapping = undefined;
    }

    /**
     * Get mapped import fields for saving
     */
    getMappedImportFieldsForSaving() {
        const mappedFiledOptions = (fieldOptions): SavedImportOption[] => {
            // create the array we'll return
            const mappedFieldOptions = [];
            // if field options are not empty, for each option push a new model of option to be saved
            if (!_.isEmpty(fieldOptions)) {
                _.each(fieldOptions, (fieldOption) => {
                    mappedFieldOptions.push(new SavedImportOption({
                        source: fieldOption.sourceOption ? fieldOption.sourceOption : '',
                        destination: fieldOption.destinationOption ? fieldOption.destinationOption : ''
                    }));
                });
            }

            return mappedFieldOptions;
        };
        // create array of mapped import fields for saving
        const mappedImportFieldsForSaving = [];

        _.each(this.mappedFields, (mappedField: ImportableMapField) => {
            mappedImportFieldsForSaving.push(new SavedImportField({
                source: mappedField.sourceField,
                destination: mappedField.destinationField,
                options: mappedFiledOptions(mappedField.mappedOptions),
                levels: mappedField.getSourceDestinationLevels()
            }));
        });

        return mappedImportFieldsForSaving;
    }

    /**
     * Load a saved import mapping
     */
    loadSavedImportMapping(savedImportMapping: SavedImportMappingModel) {
        // keep loaded import mapping reference
        this.loadedImportMapping = savedImportMapping;

        const mapOfRequiredDestinationFields = this.requiredDestinationFieldsMap ? _.clone(this.requiredDestinationFieldsMap) : {};
        this.mappedFields = [];
        _.each(savedImportMapping.mappingData, (option: SavedImportField) => {
            // create new map field
            const mapField = new ImportableMapField(
                option.destination,
                option.source
            );

            // had sub options ?
            mapField.mappedOptions = (option.options || []).map((item: SavedImportOption) => {
                return {
                    id: uuid(),
                    parentId: mapField.id,
                    sourceOption: item.source,
                    destinationOption: item.destination
                };
            });

            // filter out for which source doesn't exist anymore
            if (!_.isEmpty(mapField.mappedOptions)) {
                // map possible source options
                const optionValuesMap = this.importableObject.distinctFileColumnValuesKeyValue ?
                    _.transform(
                        this.importableObject.distinctFileColumnValuesKeyValue[mapField.sourceFieldWithoutIndexes],
                        (a, v) => {
                            a[v.value] = v;
                        },
                        {}
                    ) :
                    {};

                // filter out items that aren't mapped out
                // make not match value appear but ignored when sent to server, this way we can save import mappings without loosing old values
                _.each(mapField.mappedOptions, (
                    item: IMappedOption
                ) => {
                    if (item.sourceOption && !optionValuesMap[item.sourceOption]) {
                        item.readOnly = true;
                    }
                });
            }

            // map sub levels ( array indexes )
            mapField.setSourceDestinationLevels(option.levels);

            // required ?
            if (mapOfRequiredDestinationFields[mapField.destinationField]) {
                mapField.readonly = true;
                delete mapOfRequiredDestinationFields[mapField.destinationField];
            }

            // add it to the list
            this.mappedFields.push(mapField);

            // add new source items that weren't saved previously
            this.addMapOptionsIfNecessary(
                mapField,
                false
            );
        });

        // add missing required fields
        _.each(mapOfRequiredDestinationFields, (n: boolean, property: string) => {
            // create
            const importableItem = new ImportableMapField(
                property
            );

            // make it readonly
            importableItem.readonly = true;

            // add to list
            this.mappedFields.push(importableItem);
        });
    }

    /**
     * Display error
     * @param messageToken
     * @param hideLoading
     */
    private displayError(
        messageToken: string,
        hideLoading: boolean = false
    ) {
        // display toast
        this.snackbarService.showError(
            messageToken,
            this.translationData
        );

        // hide loading ?
        if (hideLoading) {
            // display form
            this._displayLoading = false;
            this._displayLoadingLocked = false;
            this.progress = null;
        }
    }

    /**
     * File hover dropzone
     * @param hasFileOver
     */
    public hoverDropZone(hasFileOver: boolean) {
        this.hasFileOver = hasFileOver;
    }

    /**
     * Upload file
     */
    public uploadFile() {
        // display loading
        this._displayLoading = true;
        this._displayLoadingLocked = true;
        this.progress = 0;

        // start uploading data - upload all not working if an error occurred when trying to upload this file, so we couldn't try again
        this.uploader.queue[0].upload();
    }

    /**
     * do we have arrays? if so, add indexes
     * @param mapValue
     * @param itemLevels
     */
    addIndexesToArrays(
        mapValue: string,
        itemLevels: number[]
    ): any {
        // add indexes
        let index: number = 0;
        while (mapValue ? mapValue.indexOf('[]') > -1 : false) {
            mapValue = mapValue.replace(
                '[]',
                '[' + itemLevels[index] + ']'
            );
            index++;
        }

        // finished
        return mapValue;
    }

    /**
     * Track by mapped field / option
     * @param index
     * @param item
     */
    trackByFieldID(index: number, item: { id: string }): string {
        return item.id;
    }

    /**
     * Import data
     * @param form
     */
    importData(form: NgForm) {
        // // do we have import data url ?
        // if (!this.importDataUrl) {
        //     // we don't need to display an error since this is a developer issue, he forgot to include url, in normal conditions this shouldn't happen
        //     return;
        // }
        //
        // // display loading
        // const loadingDialog = this.dialogService.showLoadingDialog();
        //
        // // validate items & import data
        // setTimeout(() => {
        //     // validate item
        //     _.each((form as any)._directives, (model: NgModel) => {
        //         if (
        //             model.valueAccessor &&
        //             model.valueAccessor instanceof FormSelectChangeDetectionPushComponent
        //         ) {
        //             // touch, validate & detect changes
        //             model.valueAccessor.touch();
        //             model.valueAccessor.control.updateValueAndValidity();
        //             model.valueAccessor.validateAndMarkForCheck();
        //         }
        //     });
        //
        //     // check valid fields & import data if we don't have any errors
        //     setTimeout(() => {
        //         // do we have invalid fields ?
        //         if (!this.formHelper.validateForm(
        //             form,
        //             false
        //         )) {
        //             // invalid form
        //             loadingDialog.close();
        //             return;
        //         }
        //
        //         // import data
        //         // display loading
        //         const allFields: any = this.formHelper.getFields(form);
        //         this._displayLoading = true;
        //         this._displayLoadingLocked = true;
        //         loadingDialog.close();
        //         setTimeout(() => {
        //             // nothing to import - this is handled above, when we convert JSON to importable object
        //             // NO NEED for further checks
        //
        //             // construct import JSON
        //             const importJSON = {
        //                 fileId: this.importableObject.id,
        //                 map: {},
        //                 valuesMap: {}
        //             };
        //             _.each(
        //                 allFields.mapObject,
        //                 (item: {
        //                     source: string,
        //                     destination: string,
        //                     sourceDestinationLevel?: number[],
        //                     options: {
        //                         sourceOption: string,
        //                         destinationOption: string
        //                     }[]
        //                 }) => {
        //                     // forge the almighty source & destination
        //                     let source: string = item.source;
        //                     let destination: string = item.destination;
        //
        //                     // add indexes to source arrays
        //                     source = this.addIndexesToArrays(
        //                         source,
        //                         item.sourceDestinationLevel
        //                     );
        //
        //                     // add indexes to destination arrays
        //                     destination = this.addIndexesToArrays(
        //                         destination,
        //                         item.sourceDestinationLevel
        //                     );
        //
        //                     // map main properties
        //                     importJSON.map[source] = destination;
        //
        //                     // map drop-down values
        //                     if (
        //                         item.options &&
        //                         !_.isEmpty(item.options)
        //                     ) {
        //                         // here we don't need to add indexes, so we keep the arrays just as they are
        //                         // also, we need to merge value Maps with the previous ones
        //                         const properSource = item.source.replace(/\[\d+\]/g, '[]');
        //                         importJSON.valuesMap[properSource] = {
        //                             ...importJSON.valuesMap[properSource],
        //                             ..._.transform(
        //                                 item.options,
        //                                 (result, option: {
        //                                     sourceOption: string,
        //                                     destinationOption: string
        //                                 }) => {
        //                                     result[option.sourceOption] = option.destinationOption;
        //                                 },
        //                                 {}
        //                             )
        //                         };
        //                     }
        //                 }
        //             );
        //
        //             // import data
        //             this.progress = null;
        //             this.importExportDataService.importData(
        //                 this.importDataUrl,
        //                 importJSON
        //             )
        //                 .pipe(
        //                     catchError((err) => {
        //                         // display error message
        //                         if (err.code === 'IMPORT_PARTIAL_SUCCESS') {
        //                             // construct custom message
        //                             this.errMsgDetails = err;
        //
        //                             // display error
        //                             this.snackbarService.showError('LNG_PAGE_IMPORT_DATA_ERROR_SOME_RECORDS_NOT_IMPORTED');
        //                         } else {
        //                             this.snackbarService.showApiError(err);
        //                         }
        //
        //                         // reset loading
        //                         this._displayLoading = false;
        //                         this._displayLoadingLocked = false;
        //
        //                         // propagate err
        //                         return throwError(err);
        //                     })
        //                 )
        //                 .subscribe(() => {
        //                     // display success
        //                     this.snackbarService.showSuccess(
        //                         this.importSuccessMessage,
        //                         this.translationData
        //                     );
        //
        //                     // emit finished event - event should handle redirect
        //                     this.finished.emit();
        //                 });
        //         });
        //     });
        // });
    }

    /**
     * Reset form & try again
     */
    tryAgain() {
        this.importableObject = null;
        this.errMsgDetails = null;
        this.uploader.clearQueue();
        this.mappedFields = [];
        this.decryptPassword = null;
        this.loadedImportMapping = undefined;
    }

    /**
     * Set Map Field property value and add options if necessary
     */
    setSourceDestinationValueAndDetermineOptions(
        item: ImportableMapField,
        property: string,
        value: any
    ) {
        // set value
        item[property] = value ? value.value : value;

        // add options if necessary
        this.addMapOptionsIfNecessary(item);
    }

// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// ALL NEW METHODS
// NEED TO CLEANUP ABOVE AFTER FINISH
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// ..................
// + CLEANUP LNG_...nefolosite...
// + CLEANUP LNG_...nefolosite...
// + CLEANUP LNG_...nefolosite...
// + CLEANUP LNG_...nefolosite...
// + CLEANUP LNG_...nefolosite...

    /**
     * Stop previous job
     */
    private stopTableDataMaxHeight(): void {
        if (this.determineTableDataMaxHeightJob) {
            clearTimeout(this.determineTableDataMaxHeightJob);
            this.determineTableDataMaxHeightJob = undefined;
        }
    }

    /**
     * Determine import data max height
     */
    private determineTableDataMaxHeight(): void {
        // stop previous job
        this.stopTableDataMaxHeight();

        // check if map fields are visible
        // wait for mappedDataTable to be initialized
        if (!this.areMapFieldVisible) {
            // wait
            this.determineTableDataMaxHeightJob = setTimeout(() => {
                this.determineTableDataMaxHeight();
            }, 200);

            // finished
            return;
        }

        // determine data height
        this.importDataBodyRowsMaxHeight = this.domSanitizer.bypassSecurityTrustStyle(`calc(100vh - (${this.mappedDataTable.nativeElement.getBoundingClientRect().top}px + 150px))`);

        // update virtual scroll height
        setTimeout(() => {
            if (this.virtualScrollViewport) {
                this.virtualScrollViewport.checkViewportSize();
            }
        });
    }

    /**
     * Clear element in edit mode
     */
    private clearElementInEditMode(): void {
        // reset
        this.elementInEditMode = undefined;
    }

    /**
     * Edit item
     */
    private editItem(
        item: ImportableMapField | IMappedOption,
        handler?: HoverRowActionsDirective
    ): void {
        // clear element in edit mode
        this.clearElementInEditMode();

        // remember element in edit mode
        this.elementInEditMode = item;

        // render row selection
        if (handler) {
            handler.hoverRowActionsComponent.hideEverything();
        }
    }

    /**
     * Re-render form
     */
    private forceRenderTable(): void {
        this.mappedFields = [...this.mappedFields];
    }

    /**
     * Add new field map
     */
    addNewFieldMap(): void {
        // create the new item
        const newItem: ImportableMapField = new ImportableMapField();

        // add new item at the top
        this.mappedFields = [
            newItem,
            ...this.mappedFields
        ];

        // edit item
        this.editItem(newItem);

        // scroll into view and make it visible
        if (this.virtualScrollViewport) {
            this.virtualScrollViewport.scrollToOffset(0);
        }
    }

    /**
     * Add new field option map
     */
    private addNewOptionMap(
        item: ImportableMapField,
        handler: HoverRowActionsDirective
    ): void {
        // create new field option
        const fieldOption: IMappedOption = {
            id: uuid(),
            parentId: item.id
        };

        // add field option
        item.mappedOptions = [
            fieldOption,
            ...item.mappedOptions
        ];

        // start edit
        this.editItem(
            fieldOption,
            handler
        );
    }

    /**
     * Clone field option map
     */
    private cloneFieldMap(
        item: ImportableMapField,
        handler: HoverRowActionsDirective,
        index: number
    ): void {
        // clone field item
        // mapped options aren't cloneable
        const clonedItem: ImportableMapField = new ImportableMapField(
            item.destinationField,
            item.sourceField
        );

        // insert item in table
        this.mappedFields.splice(
            index + 1,
            0,
            clonedItem
        );

        // force rerender
        this.forceRenderTable();

        // start edit item
        this.editItem(
            clonedItem,
            handler
        );
    }

    /**
     * Remove item
     */
    private removeItemMap(
        item: ImportableMapField | IMappedOption,
        index: number
    ): void {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_IMPORT_FIELD_MAP')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // remove item
                    if (item instanceof ImportableMapField) {
                        // remove
                        this.mappedFields.splice(index, 1);

                        // force re-render
                        this.forceRenderTable();

                        // clear edit mode if item or parent was removed
                        if (
                            this.elementInEditMode && (
                                item.id === this.elementInEditMode.id ||
                                (this.elementInEditMode as IMappedOption).parentId === item.id
                            )
                        ) {
                            // clear edit mode
                            this.clearElementInEditMode();
                        }
                    } else {
                        // find & remove field option map
                        const parent: ImportableMapField = this.mappedFields.find((mf) => mf.id === item.parentId);
                        if (parent) {
                            // determine index
                            const parentIndex: number = parent.mappedOptions.indexOf(item);
                            if (parentIndex > -1) {
                                // remove
                                parent.mappedOptions.splice(parentIndex, 1);

                                // force re-render
                                this.forceRenderTable();
                            }
                        }

                        // clear edit mode if item or parent was removed
                        if (
                            this.elementInEditMode &&
                            item.id === this.elementInEditMode.id
                        ) {
                            // clear edit mode
                            this.clearElementInEditMode();
                        }
                    }

                }
            });
    }

    /**
     * Stop schedule job
     */
    private stopDataScheduleJob(): void {
        if (this.scheduleJob) {
            clearTimeout(this.scheduleJob);
            this.scheduleJob = undefined;
        }
    }

    /**
     * Used to do periodic management of data (not perfect, but otherwise we would need to rethink most of the above logic)
     */
    private runDataScheduleJob(): void {
        // stop previous job
        this.stopDataScheduleJob();

        //  no point in continuing ?
        if (!this.areMapFieldVisible) {
            this.scheduleJob = setTimeout(() => {
                this.runDataScheduleJob();
            }, 800);
        }

        // go through map fields and determine mapped sources
        const usedSourceFields: {
            [source: string]: number
        } = {};
        (this.mappedFields || []).forEach((field) => {
            // no point in continuing if I don't have a source selected
            if (!field.sourceField) {
                return;
            }

            // determine source key
            const sourceKey: string = field.sourceFieldWithSelectedIndexes;

            // count items
            usedSourceFields[sourceKey] = usedSourceFields[sourceKey] ? usedSourceFields[sourceKey] + 1 : 1;
        });

        // change only if values are different so we don't trigger even more binding checks
        if (!_.isEqual(this.usedSourceFields, usedSourceFields)) {
            this.usedSourceFields = usedSourceFields;
        }

        // run again later
        this.scheduleJob = setTimeout(() => {
            this.runDataScheduleJob();
        }, 800);
    }

    /**
     * Set destination level
     */
    setDestinationLevel(
        item: ImportableMapField,
        levelIndex: number,
        value: any
    ): void {
        // set level
        item.setSourceDestinationLevel(
            levelIndex,
            value ? value.value : value
        );
    }
}
