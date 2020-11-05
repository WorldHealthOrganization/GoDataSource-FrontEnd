import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { environment } from '../../../../../environments/environment';
import { IMappedOption, IModelArrayProperties, ImportableFileModel, ImportableFilePropertiesModel, ImportableFilePropertyValuesModel, ImportableLabelValuePair, ImportableMapField, ImportDataExtension } from './model';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { v4 as uuid } from 'uuid';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SavedImportMappingService } from '../../../../core/services/data/saved-import-mapping.data.service';
import {
    DialogButton, DialogComponent,
    DialogConfiguration, DialogField,
    DialogFieldType
} from '../../../../shared/components/dialog/dialog.component';
import {
    ISavedImportMappingModel,
    SavedImportField, SavedImportMappingModel,
    SavedImportOption
} from '../../../../core/models/saved-import-mapping.model';
import { Observable } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { MatDialogRef } from '@angular/material';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeStyle } from '@angular/platform-browser/src/security/dom_sanitization_service';
import { HoverRowActionsDirective } from '../../../../shared/directives/hover-row-actions/hover-row-actions.directive';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { LocationAutoItem } from '../../../../shared/components/form-location-dropdown/form-location-dropdown.component';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';

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

    // Extension mapped to mimes
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

    // Allowed extensions
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

    // Page title
    @Input() title: string = '';

    // Tell system if this doesn't need to go through map step, uploading file is enough
    @Input() isOneStep: boolean = false;

    // Model provided to import for input
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

    // Saved import mapping
    @Input() savedImportPage: string;

    // List with saved import mappings
    savedMappingsList$: Observable<SavedImportMappingModel[]>;

    // loaded saved import mapping
    loadedImportMapping: ISavedImportMappingModel = null;

    // File uploader
    uploader: FileUploader;

    // Cursor is over drag-drop file zone
    hasFileOver: boolean = false;

    // Variables sent to translation pipe
    translationData: {
        types?: string
    } = {};

    // Percent displayed when uploading a file
    progress: number = null;

    // Display spinner when True, otherwise display the form
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

    // Import success message
    @Input() importSuccessMessage: string = 'LNG_PAGE_IMPORT_DATA_SUCCESS_MESSAGE';

    // finished - imported data with success
    // Event called when we finished importing data ( this should handle page redirect )
    @Output() finished = new EventEmitter<void>();

    // Where should we POST mapped data to ( endpoint that imports data )
    @Input() importDataUrl: string;

    // Endpoint to upload file ( & get header columns and other data )
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

    // Tokens for properties for which we don't receive labels from the server
    @Input() fieldsWithoutTokens: {
        [property: string]: string
    } = {};

    // Address fields should use outbreak locations ?
    @Input() useOutbreakLocations: boolean = false;

    // Address fields so we can use custom dropdowns
    @Input() addressFields: {
        [property: string]: boolean
    } = {};

    // Required fields that user needs to map
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

    // Alis under which we upload the file
    @Input() fileUploadAlias: string;

    // Data to send to format callback
    @Input() extraDataUsedToFormatData: any;

    // Callback called after we receive model definitions from api
    //  * - through this callback we can alter the api response
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

    // Keep all file data ( header columns, module information, drop-down options etc )
    importableObject: ImportableFileModel;

    // Source / Destination level value
    possibleSourceDestinationLevels: LabelValuePair[];

    // Mapped fields
    mappedFields: ImportableMapField[] = [];

    // Keep err msg details
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

    // Constants / Classes
    ImportServerErrorCodes = ImportServerErrorCodes;

    // Decrypt password
    decryptPassword: string;

    // Decrypt password alias
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
                    item.sourceFieldWithoutIndexes &&
                    item.destinationField &&
                    this.distinctValuesCache &&
                    this.distinctValuesCache[item.sourceFieldWithoutIndexes] && (
                        !!this.importableObject.modelPropertyValuesMap[item.destinationField] ||
                        this.addressFields[item.destinationField]
                    ) &&
                    item.mappedOptions.length < this.distinctValuesCache[item.sourceFieldWithoutIndexes].length;
            },
            click: (
                item: ImportableMapField,
                handler: HoverRowActionsDirective
            ) => {
                // add option
                this.addNewOptionMap(
                    item,
                    handler
                );
            }
        }),

        // Expand
        new HoverRowAction({
            icon: 'thinArrowRight',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_EXPAND_OPTIONS',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return (item instanceof ImportableMapField) &&
                    item.sourceFieldWithoutIndexes &&
                    item.destinationField &&
                    this.distinctValuesCache &&
                    this.distinctValuesCache[item.sourceFieldWithoutIndexes] && (
                        !!this.importableObject.modelPropertyValuesMap[item.destinationField] ||
                        this.addressFields[item.destinationField]
                    ) &&
                    item.mappedOptionsCollapsed;
            },
            click: (
                item: ImportableMapField,
                handler: HoverRowActionsDirective
            ) => {
                // expand
                item.mappedOptionsCollapsed = false;

                // render row selection
                handler.hoverRowActionsComponent.hideEverything();
            }
        }),

        // Collapse
        new HoverRowAction({
            icon: 'thinArrowDown',
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_COLLAPSE_OPTIONS',
            visible: (item: ImportableMapField | IMappedOption): boolean => {
                return (item instanceof ImportableMapField) &&
                    item.sourceFieldWithoutIndexes &&
                    item.destinationField &&
                    this.distinctValuesCache &&
                    this.distinctValuesCache[item.sourceFieldWithoutIndexes] && (
                        !!this.importableObject.modelPropertyValuesMap[item.destinationField] ||
                        this.addressFields[item.destinationField]
                    ) &&
                    !item.mappedOptionsCollapsed;
            },
            click: (
                item: ImportableMapField,
                handler: HoverRowActionsDirective
            ) => {
                // collapse
                item.mappedOptionsCollapsed = true;

                // render row selection
                handler.hoverRowActionsComponent.hideEverything();
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
            iconTooltip: 'LNG_PAGE_IMPORT_DATA_BUTTON_CLOSE_MODIFY',
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
                // clone field
                this.cloneFieldMap(
                    item,
                    handler,
                    index
                );
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
                // remove item
                this.removeItemMap(
                    item,
                    index
                );
            }
        })
    ];

    // display map button or start import ?
    needToMapOptions: boolean = true;

    // used to determine duplicate selections
    usedSourceFieldsForDuplicateCheck: {
        fields: {
            [sourceFieldWithSelectedIndexes: string]: number
        },
        valid: boolean
    } = {
        fields: {},
        valid: false
    };

    // used to determine duplicate selections
    usedSourceFieldOptions: {
        [source: string]: {
            options: {
                [option: string]: number
            },
            valid: boolean,
            complete: {
                no: number,
                total: number
            },
            incomplete: {
                no: number,
                total: number
            }
        }
    } = {};

    // distinct values cache
    distinctValuesCache: {
        [fileHeader: string]: ImportableLabelValuePair[]
    } = {};

    // location cache for easy access
    locationCache: {
        [locationId: string]: {
            label: string,
            shortLabel: string,
            parentsLoaded: boolean,
            parentId: string
        }
    } = {};
    locationCacheIndex: {
        [indexKey: string]: string[]
    } = {};

    // Used to keep function scope
    onWindowResizeScope: any;

    /**
     * Constructor
     */
    constructor(
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private importExportDataService: ImportExportDataService,
        private savedImportMappingService: SavedImportMappingService,
        private domSanitizer: DomSanitizer,
        private locationDataService: LocationDataService
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
                // wait for bindings
                setTimeout(() => {
                    // process file data
                    this.processFileData(
                        item,
                        response
                    );
                }, 50);
            }
        };

        // register window resize listeners
        this.onWindowResizeScope = () => {
            this.determineTableDataMaxHeight();
        };
        window.addEventListener(
            'resize',
            this.onWindowResizeScope,
            true
        );
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // remove window resize listener
        window.removeEventListener(
            'resize',
            this.onWindowResizeScope,
            true
        );
    }

    /**
     * Process file data
     */
    private processFileData(
        item: FileItem,
        response: string
    ): void {
        // after we do the math
        setTimeout(() => {
            // adjust height of table after we do the math
            this.determineTableDataMaxHeight();

            // validate data
            this.validateData();
        });

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
            // display errors
            this.displayError(
                'LNG_PAGE_IMPORT_DATA_ERROR_INVALID_RESPONSE_FROM_SERVER',
                true
            );

            // finished
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
        this.distinctValuesCache = {};
        this.locationCache = {};
        this.locationCacheIndex = {};
        this.importableObject = new ImportableFileModel(
            jsonResponse,
            (token: string): string => {
                return this.i18nService.instant(token);
            },
            fileType,
            this.fieldsWithoutTokens,
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

        // display form
        this._displayLoading = false;
        this._displayLoadingLocked = false;
        this.progress = null;
    }

    /**
     * Get saved import mappings for specific page
     */
    getImportMappings(
        finishedCallback?: () => void
    ) {
        // specify for what page we want to get the saved items
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            mappingKey: {
                eq: this.savedImportPage
            }
        });

        // since mappingData could be really big we need to retrieve only what is used by the list followed by retrieving more data if we need it
        qb.fields(
            'id',
            'name',
            'readOnly',

            // required by API - it should be added by api, but at the moment it doesn't work like this
            // #TODO - changes on API
            'userId'
        );

        // retrieve data
        this.savedMappingsList$ = this.savedImportMappingService
            .getImportMappingsList(qb)
            .pipe(tap(() => {
                if (finishedCallback) {
                    finishedCallback();
                }
            }));
    }

    /**
     * Add drop-downs for mapping a drop-down type options
     */
    addMapOptionsIfNecessary(
        importableItem: ImportableMapField,
        reInitOptions: boolean = true,
        restrictTo?: {
            [fieldOptionSource: string]: string[]
        }
    ) {
        // add all distinct source as items that we need to map
        importableItem.mappedOptions = reInitOptions ? [] : (importableItem.mappedOptions || []);

        // there is no point in setting mapped values if we  don't have to map something
        if (
            !importableItem.sourceFieldWithoutIndexes ||
            !importableItem.destinationField ||
            !this.distinctValuesCache ||
            !this.distinctValuesCache[importableItem.sourceFieldWithoutIndexes] || (
                !this.importableObject.modelPropertyValuesMap[importableItem.destinationField] &&
                !this.addressFields[importableItem.destinationField]
            )
        ) {
            return;
        }

        // we CAN'T use _.get because importableItem.sourceField contains special chars [ / ] / .
        const distinctValues: ImportableLabelValuePair[] = this.distinctValuesCache[importableItem.sourceFieldWithoutIndexes];
        _.each(distinctValues, (distinctVal: ImportableLabelValuePair) => {
            // create map option with source
            const mapOpt: IMappedOption = {
                id: uuid(),
                parentId: importableItem.id,
                sourceOption: distinctVal.value
            };

            // do we need to restrict to specific options ?
            let destinationOpt: string;
            if (restrictTo) {
                // ignore this one ?
                if (!restrictTo[mapOpt.sourceOption]) {
                    return;
                }

                // found a possible destination field
                if (
                    restrictTo[mapOpt.sourceOption] &&
                    restrictTo[mapOpt.sourceOption].length === 1
                ) {
                    // get value
                    const destinationValue: string = restrictTo[mapOpt.sourceOption][0];

                    // determine destination option
                    destinationOpt = this.addressFields[importableItem.destinationField] ? (
                        this.locationCache[destinationValue] ?
                            destinationValue :
                            undefined
                    ) : (
                        this.importableObject.modelPropertyValuesMapChildMap[importableItem.destinationField] &&
                            this.importableObject.modelPropertyValuesMapChildMap[importableItem.destinationField][destinationValue] !== undefined ?
                                destinationValue :
                                undefined
                    );

                    // found a possible destination field
                    if (destinationOpt) {
                        mapOpt.destinationOption = destinationOpt;
                    }
                }

                // add option
                importableItem.mappedOptions.push(mapOpt);
            } else {
                // check if we can find a proper destination option
                const sourceOptReduced: string = _.camelCase(mapOpt.sourceOption).toLowerCase();
                destinationOpt = this.addressFields[importableItem.destinationField] ? (
                    this.locationCacheIndex[sourceOptReduced] && this.locationCacheIndex[sourceOptReduced].length === 1 ?
                        this.locationCacheIndex[sourceOptReduced][0] :
                        undefined
                ) : (
                    this.importableObject.modelPropertyValuesMapIndex[importableItem.destinationField] ?
                        this.importableObject.modelPropertyValuesMapIndex[importableItem.destinationField][sourceOptReduced] :
                        undefined
                );

                // found a possible destination field
                if (destinationOpt) {
                    mapOpt.destinationOption = destinationOpt;
                }

                // add option
                importableItem.mappedOptions.push(mapOpt);
            }
        });
    }

    /**
     * Save an import mapping
     */
    saveImportMapping() {
        // create import mapping
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
                        // display loading
                        const loadingDialog = this.dialogService.showLoadingDialog();

                        // create import mappings
                        this.savedImportMappingService
                            .createImportMapping(new SavedImportMappingModel({
                                name: answer.inputValue.value.mappingImportName,
                                isPublic: answer.inputValue.value.isPublic,
                                mappingKey: this.savedImportPage,
                                mappingData: this.getMappedImportFieldsForSaving()
                            }))
                            .pipe(
                                catchError((err) => {
                                    // display error
                                    this.snackbarService.showApiError(err);

                                    // hide loading
                                    loadingDialog.close();

                                    // throw error down the road
                                    return throwError(err);
                                })
                            )
                            .subscribe((data: SavedImportMappingModel) => {
                                // refresh import mappings
                                this.getImportMappings(() => {
                                    // update loading item
                                    this.loadedImportMapping = {
                                        id: data.id,
                                        name: data.name,
                                        readOnly: data.readOnly
                                    };

                                    // hide loading
                                    loadingDialog.close();

                                    // display success message
                                    this.snackbarService.showSuccess(`LNG_PAGE_IMPORT_DATA_LOAD_SAVED_IMPORT_MAPPING_SUCCESS_MESSAGE`);
                                });
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
                        // display loading
                        const loadingDialog = this.dialogService.showLoadingDialog();

                        // update
                        this.savedImportMappingService
                            .modifyImportMapping(
                                this.loadedImportMapping.id, {
                                    mappingData: this.getMappedImportFieldsForSaving()
                                }
                            )
                            .pipe(
                                catchError((err) => {
                                    // display error
                                    this.snackbarService.showApiError(err);

                                    // hide loading
                                    loadingDialog.close();

                                    // throw error down the road
                                    return throwError(err);
                                })
                            )
                            .subscribe((data: SavedImportMappingModel) => {
                                // refresh import mappings
                                this.getImportMappings(() => {
                                    // update import mapping
                                    this.loadedImportMapping = {
                                        id: data.id,
                                        name: data.name,
                                        readOnly: data.readOnly
                                    };

                                    // hide loading
                                    loadingDialog.close();

                                    // display message
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_SAVED_IMPORT_MAPPING_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE');
                                });
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
     * Get mapped import fields for saving
     */
    getMappedImportFieldsForSaving(): SavedImportField[] {
        // prepare field options for save
        return (this.mappedFields || []).map((mappedField) => new SavedImportField({
            source: mappedField.sourceField,
            destination: mappedField.destinationField,
            options: !mappedField.mappedOptions ?
                undefined :
                mappedField.mappedOptions.map((fieldOption) => new SavedImportOption({
                    source: fieldOption.sourceOption ? fieldOption.sourceOption : '',
                    destination: fieldOption.destinationOption ? fieldOption.destinationOption : ''
                })),
            levels: mappedField.getSourceDestinationLevels()
        }));
    }

    /**
     * Load a saved import mapping
     */
    loadSavedImportMapping(savedImportMapping: ISavedImportMappingModel) {
        // keep loaded import mapping reference
        this.loadedImportMapping = savedImportMapping;

        // nothing to retrieve ?
        if (
            !this.loadedImportMapping ||
            !this.loadedImportMapping.id
        ) {
            return;
        }

        // ask for confirmation
        this.dialogService
            .showConfirm(
                'LNG_PAGE_IMPORT_DATA_LOAD_SAVED_MAPPING_CONFIRMATION', {
                    name: savedImportMapping.name
                }
            )
            .subscribe((answer: DialogAnswer) => {
                // Cancel ?
                if (answer.button !== DialogAnswerButton.Yes) {
                    // deselect
                    this.loadedImportMapping = null;

                    // finished
                    return;
                }

                // display loading
                const loadingDialog = this.createPrepareMapDataLoadingDialog();

                // reset scroll position
                if (this.virtualScrollViewport) {
                    this.virtualScrollViewport.scrollToOffset(0);
                }

                // retrieve mapping data
                loadingDialog.showMessage('LNG_PAGE_IMPORT_DATA_LABEL_RETRIEVE_MAP_DATA');
                this.savedImportMappingService
                    .getImportMapping(this.loadedImportMapping.id)
                    .pipe(
                        catchError((err) => {
                            // hide loading
                            loadingDialog.close();

                            // show error
                            this.snackbarService.showApiError(err);
                            return throwError(err);
                        })
                    )
                    .subscribe((importMapping: SavedImportMappingModel) => {
                        // map fields
                        loadingDialog.showMessage('LNG_PAGE_IMPORT_DATA_LABEL_MODEL_MAPPINGS');

                        // wait for message to be displayed
                        setTimeout(() => {
                            // clear map data
                            this.mappedFields = [];
                            this.distinctValuesCache = {};
                            this.locationCache = {};
                            this.locationCacheIndex = {};

                            // map fields
                            const mapOfRequiredDestinationFields = this.requiredDestinationFieldsMap ? _.clone(this.requiredDestinationFieldsMap) : {};
                            (importMapping.mappingData || []).forEach((savedFieldMap) => {
                                // initialize field map
                                const field: ImportableMapField = new ImportableMapField(
                                    savedFieldMap.destination,
                                    savedFieldMap.source
                                );

                                // map levels
                                if (savedFieldMap.levels) {
                                    field.setSourceDestinationLevels(savedFieldMap.levels);
                                }

                                // required ?
                                if (mapOfRequiredDestinationFields[field.destinationField]) {
                                    field.readonly = true;
                                    delete mapOfRequiredDestinationFields[field.destinationField];
                                }

                                // add it to the list
                                this.mappedFields.push(field);
                            });

                            // add missing required fields
                            _.each(mapOfRequiredDestinationFields, (
                                n: boolean,
                                destinationField: string
                            ) => {
                                // create
                                const importableItem = new ImportableMapField(
                                    destinationField
                                );

                                // make it readonly
                                importableItem.readonly = true;

                                // add to list
                                this.mappedFields.push(importableItem);
                            });

                            // go through process of mapping sub options accordingly to what was saved
                            // this method will hide the loading dialog too
                            setTimeout(() => {
                                this.retrieveDistinctValues(
                                    loadingDialog,
                                    importMapping
                                );
                            }, 50);
                        });
                    });
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
     * Import data
     */
    importData() {
        // do we have import data url ?
        if (!this.importDataUrl) {
            // we don't need to display an error since this is a developer issue, he forgot to include url, in normal conditions this shouldn't happen
            return;
        }

        // display loading
        const loadingDialog = this.dialogService.showLoadingDialog();

        // validate items & import data
        setTimeout(() => {
            // prepare data
            this.validateData();

            // go through data
            const invalidFieldRows: number[] = [];
            this.mappedFields.forEach((field, fieldIndex) => {
                // check if field is valid
                if (
                    !field.sourceField ||
                    !field.destinationField ||
                    !field.sourceDestinationLevelAreValid || (
                        field.sourceFieldWithSelectedIndexes &&
                        this.usedSourceFieldsForDuplicateCheck.fields[field.sourceFieldWithSelectedIndexes] > 1
                    ) || (
                        this.usedSourceFieldOptions[field.sourceFieldWithSelectedIndexes] &&
                        !this.usedSourceFieldOptions[field.sourceFieldWithSelectedIndexes].valid
                    )
                ) {
                    // add to invalid rows
                    invalidFieldRows.push(fieldIndex + 1);
                }
            });

            // stop import & display invalid rows
            if (invalidFieldRows.length > 0) {
                // hide loading
                loadingDialog.close();

                // display error message
                this.snackbarService.showError(
                    'LNG_PAGE_IMPORT_DATA_ERROR_INVALID_ROWS', {
                        rows: invalidFieldRows.join(', ')
                    }
                );

                // finished
                return;
            }

            // construct import JSON
            const importJSON = {
                fileId: this.importableObject.id,
                map: {},
                valuesMap: {}
            };

            // convert import data to what API is expecting
            this.mappedFields.forEach((field) => {
                // forge the almighty source & destination
                let source: string = field.sourceField;
                let destination: string = field.destinationField;

                // add indexes to source arrays
                source = this.addIndexesToArrays(
                    source,
                    field.getSourceDestinationLevels()
                );

                // add indexes to destination arrays
                destination = this.addIndexesToArrays(
                    destination,
                    field.getSourceDestinationLevels()
                );

                // map main properties
                importJSON.map[source] = destination;

                // map field options
                if (
                    field.mappedOptions &&
                    field.mappedOptions.length > 0
                ) {
                    // here we don't need to add indexes, so we keep the arrays just as they are
                    // also, we need to merge value Maps with the previous ones
                    const properSource = field.sourceFieldWithoutIndexes;
                    if (!importJSON.valuesMap[properSource]) {
                        importJSON.valuesMap[properSource] = {};
                    }

                    // add options
                    field.mappedOptions.forEach((option) => {
                        importJSON.valuesMap[properSource][option.sourceOption] = option.destinationOption;
                    });
                }
            });

            // import data
            // #TODO - check periodically where we are ( n rows from total )
            this.importExportDataService
                .importData(
                    this.importDataUrl,
                    importJSON
                )
                .pipe(
                    catchError((err) => {
                        // display error message
                        if (err.code === 'IMPORT_PARTIAL_SUCCESS') {
                            // construct custom message
                            this.errMsgDetails = err;

                            // display error
                            this.snackbarService.showError('LNG_PAGE_IMPORT_DATA_ERROR_SOME_RECORDS_NOT_IMPORTED');
                        } else {
                            this.snackbarService.showApiError(err);
                        }

                        // hide loading
                        loadingDialog.close();

                        // propagate err
                        return throwError(err);
                    })
                )
                .subscribe(() => {
                    // display success
                    this.snackbarService.showSuccess(
                        this.importSuccessMessage,
                        this.translationData
                    );

                    // hide loading
                    loadingDialog.close();

                    // emit finished event - event should handle redirect
                    this.finished.emit();
                });
        });
    }

    /**
     * Reset form & try again
     */
    tryAgain() {
        // reset data
        this.distinctValuesCache = {};
        this.locationCache = {};
        this.locationCacheIndex = {};
        this.importableObject = null;
        this.errMsgDetails = null;
        this.uploader.clearQueue();
        this.mappedFields = [];
        this.decryptPassword = null;
        this.loadedImportMapping = null;

        // prepare data
        this.validateData();
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

        // prepare data
        this.validateData();
    }

    /**
     * Determine import data max height
     */
    private determineTableDataMaxHeight(): void {
        // check if map fields are visible
        // wait for mappedDataTable to be initialized
        if (!this.areMapFieldVisible) {
            // finished
            return;
        }

        // determine data height
        const importDataBodyRowsMaxHeight: SafeStyle = this.domSanitizer.bypassSecurityTrustStyle(`calc(100vh - (${this.mappedDataTable.nativeElement.getBoundingClientRect().top}px + 170px))`);
        if (this.importDataBodyRowsMaxHeight !== importDataBodyRowsMaxHeight) {
            this.importDataBodyRowsMaxHeight = importDataBodyRowsMaxHeight;

            // update virtual scroll height
            setTimeout(() => {
                if (this.virtualScrollViewport) {
                    this.virtualScrollViewport.checkViewportSize();
                }
            });
        }
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
     * Re-render form
     */
    private forceRenderField(field: ImportableMapField): void {
        field.mappedOptions = field.mappedOptions ? [...field.mappedOptions] : field.mappedOptions;
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

        // prepare data
        this.validateData();
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

        // prepare data
        this.validateData();
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

        // prepare data
        this.validateData();
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
                            // remove
                            parent.mappedOptions.splice(index, 1);

                            // force re-render
                            this.forceRenderField(parent);
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

                    // prepare data
                    this.validateData();
                }
            });
    }

    /**
     * Used to determine different information about the entire data
     */
    private validateData(): void {
        // go through map fields and determine mapped sources
        this.needToMapOptions = false;
        this.usedSourceFieldsForDuplicateCheck = {
            fields: {},
            valid: true
        };
        this.usedSourceFieldOptions = {};

        //  no point in continuing ?
        if (!this.areMapFieldVisible) {
            return;
        }

        // for speed purposes we will use for..loop
        for (let fieldIndex = 0; fieldIndex < this.mappedFields.length; fieldIndex++) {
            // retrieve field
            const field: ImportableMapField = this.mappedFields[fieldIndex];

            // no point in continuing if I don't have a source selected
            if (!field.sourceField) {
                continue;
            }

            // do we need to map source field options ?
            // this.distinctValuesCache && this.distinctValuesCache[field.sourceFieldWithoutIndexes]
            if (
                field.destinationField &&
                field.sourceFieldWithoutIndexes && (
                    !!this.importableObject.modelPropertyValuesMap[field.destinationField] ||
                    this.addressFields[field.destinationField]
                ) && (
                    !this.distinctValuesCache ||
                    !this.distinctValuesCache[field.sourceFieldWithoutIndexes]
                )
            ) {
                this.needToMapOptions = true;
            }

            // determine source key
            const sourceFieldWithSelectedIndexes: string = field.sourceFieldWithSelectedIndexes;

            // count items
            this.usedSourceFieldsForDuplicateCheck.fields[sourceFieldWithSelectedIndexes] = this.usedSourceFieldsForDuplicateCheck.fields[sourceFieldWithSelectedIndexes] ?
                this.usedSourceFieldsForDuplicateCheck.fields[sourceFieldWithSelectedIndexes] + 1 :
                1;

            // invalid form ?
            if (this.usedSourceFieldsForDuplicateCheck.fields[sourceFieldWithSelectedIndexes] > 1) {
                this.usedSourceFieldsForDuplicateCheck.valid = false;
            }

            // count options too
            this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes] = {
                options: {},
                valid: true,
                complete: {
                    no: (field.mappedOptions || []).length,
                    total: this.distinctValuesCache && this.distinctValuesCache[field.sourceFieldWithoutIndexes] ?
                        this.distinctValuesCache[field.sourceFieldWithoutIndexes].length :
                        0
                },
                incomplete: {
                    no: 0,
                    total: (field.mappedOptions || []).length
                }
            };

            // for speed purposes we will use for..loop
            for (let fieldOptionIndex = 0; fieldOptionIndex < field.mappedOptions.length; fieldOptionIndex++) {
                // retrieve field
                const fieldOpt: IMappedOption = field.mappedOptions[fieldOptionIndex];

                // no point in continuing if I don't have a source selected
                let optIsValid: boolean = true;
                if (!fieldOpt.sourceOption) {
                    // invalid
                    this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].valid = false;

                    // option isn't valid
                    optIsValid = false;
                } else {
                    // count
                    this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].options[fieldOpt.sourceOption] = this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].options[fieldOpt.sourceOption] ?
                        this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].options[fieldOpt.sourceOption] + 1 :
                        1;

                    // validate
                    if (
                        this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].options[fieldOpt.sourceOption] > 1 ||
                        !fieldOpt.destinationOption
                    ) {
                        // invalid
                        this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].valid = false;

                        // option isn't valid
                        optIsValid = false;
                    }
                }

                // count invalid options
                if (!optIsValid) {
                    this.usedSourceFieldOptions[sourceFieldWithSelectedIndexes].incomplete.no++;
                }
            }
        }
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

        // prepare data
        this.validateData();
    }

    /**
     * Set field sub-option data
     */
    setMapOptionValue(
        mappedOpt: IMappedOption,
        source: boolean,
        data: ImportableLabelValuePair | LabelValuePair
    ): void {
        // set source option
        if (source) {
            mappedOpt.sourceOption = data ? data.value : data;
        } else {
            mappedOpt.destinationOption = data ? data.value : data;
        }

        // prepare data
        this.validateData();
    }

    /**
     * Index location for easy access
     */
    private indexLocation(
        locationName: string,
        locationId: string
    ) {
        // cache
        const cacheKey: string = _.camelCase(locationName).toLowerCase();
        if (this.locationCacheIndex[cacheKey]) {
            if (!this.locationCacheIndex[cacheKey].includes(locationId)) {
                this.locationCacheIndex[cacheKey].push(locationId);
            }
        } else {
            this.locationCacheIndex[cacheKey] = [
                locationId
            ];
        }
    }

    /**
     * Create loading dialog specific for preparing the map data
     */
    private createPrepareMapDataLoadingDialog(): LoadingDialogModel {
        return this.dialogService.showLoadingDialog({
            widthPx: 400
        });
    }

    /**
     * Retrieve distinct values used to map fields
     */
    retrieveDistinctValues(
        loadingDialog?: LoadingDialogModel,
        importMapping?: SavedImportMappingModel
    ): void {
        // display loading
        loadingDialog = loadingDialog || this.createPrepareMapDataLoadingDialog();

        // determine file headers for which we need to retrieve distinct values
        const distinctValuesForKeys: string[] = [];
        const distinctValuesForKeysMap: {
            [sourceFieldWithoutIndexes: string]: ImportableMapField[]
        } = {};
        const mustRetrieveLocations: {
            [sourceFieldWithoutIndexes: string]: true
        } = {};
        this.mappedFields.forEach((field) => {
            // there is no point in retrieving unique values for items that don't need mapping
            // or already retrieved
            if (
                !field.destinationField ||
                !field.sourceFieldWithoutIndexes || (
                    !this.importableObject.modelPropertyValuesMap[field.destinationField] &&
                    !this.addressFields[field.destinationField]
                ) ||
                this.distinctValuesCache[field.sourceFieldWithoutIndexes]
            ) {
                return;
            }

            // map for easy access later
            // #TODO - only one fields should map for all other (even if they are on different indexes)
            if (!distinctValuesForKeysMap[field.sourceFieldWithoutIndexes]) {
                distinctValuesForKeysMap[field.sourceFieldWithoutIndexes] = [field];
            } else {
                distinctValuesForKeysMap[field.sourceFieldWithoutIndexes].push(field);
            }

            // must retrieve locations ?
            if (this.addressFields[field.destinationField]) {
                mustRetrieveLocations[field.sourceFieldWithoutIndexes] = true;
            }

            // add to list of items to retrieve distinct values for
            if (!distinctValuesForKeys.includes(field.sourceFieldWithoutIndexes)) {
                distinctValuesForKeys.push(field.sourceFieldWithoutIndexes);
            }
        });

        // nothing to retrieve ?
        if (distinctValuesForKeys.length < 1) {
            // prepare data
            this.validateData();

            // hide dialog
            loadingDialog.close();

            // finished
            return;
        }

        // map saved import fields for easy access
        // must be undefined when initialized, otherwise it breaks some logic
        let importMappingFieldSubOptionsMap: {
            [fieldSource: string]: {
                [fieldDestination: string]: {
                    // fieldOptionSource => fieldOptionDestination[]
                    [fieldOptionSource: string]: string[]
                }
            }
        };
        if (importMapping) {
            // init map
            importMappingFieldSubOptionsMap = {};

            // go through saved mappings and map field sub-options data
            importMapping.mappingData.forEach((savedImportField) => {
                // there is no point in mapping if we don't have everything we need
                if (
                    !savedImportField.source ||
                    !savedImportField.destination
                ) {
                    return;
                }

                // initialize field source if necessary
                if (!importMappingFieldSubOptionsMap[savedImportField.source]) {
                    importMappingFieldSubOptionsMap[savedImportField.source] = {};
                }

                // initialize field destination if necessary
                if (!importMappingFieldSubOptionsMap[savedImportField.source][savedImportField.destination]) {
                    importMappingFieldSubOptionsMap[savedImportField.source][savedImportField.destination] = {};
                }

                // map options for easy access
                (savedImportField.options || []).forEach((savedImportOption) => {
                    // no point in continuing ?
                    if (
                        !savedImportOption.source ||
                        !savedImportOption.destination
                    ) {
                        return;
                    }

                    // initialize field option source if necessary
                    if (!importMappingFieldSubOptionsMap[savedImportField.source][savedImportField.destination][savedImportOption.source]) {
                        importMappingFieldSubOptionsMap[savedImportField.source][savedImportField.destination][savedImportOption.source] = [];
                    }

                    // add field option destination if necessary
                    importMappingFieldSubOptionsMap[savedImportField.source][savedImportField.destination][savedImportOption.source].push(savedImportOption.destination);
                });
            });
        }

        // initializing message
        loadingDialog.showMessage('LNG_PAGE_IMPORT_DATA_RETRIEVING_UNIQUE_VALUES');

        // retrieve items
        this.importExportDataService
            .determineDistinctValues(
                this.importableObject.id,
                distinctValuesForKeys
            )
            .pipe(
                catchError((err) => {
                    // prepare data
                    this.validateData();

                    // hide loading
                    loadingDialog.close();

                    // show error
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe((response) => {
                // format handler
                const formattingHandler = (
                    index: number,
                    finishedCallback: () => void
                ) => {
                    // finished ?
                    if (index >= distinctValuesForKeys.length) {
                        finishedCallback();
                        return;
                    }

                    // determine key
                    const key: string = distinctValuesForKeys[index];

                    // formatting message
                    loadingDialog.showMessage(
                        'LNG_PAGE_IMPORT_DATA_POPULATING_DISTINCT_CACHE', {
                            index: (index + 1).toString(),
                            total: distinctValuesForKeys.length.toString(),
                            key: key
                        }
                    );

                    // process
                    setTimeout(() => {
                        // initialize cache
                        this.distinctValuesCache[key] = [];

                        // add items to cache
                        if (
                            response.distinctFileColumnValues &&
                            response.distinctFileColumnValues[key] &&
                            response.distinctFileColumnValues[key].length > 0
                        ) {
                            response.distinctFileColumnValues[key].forEach((fileUniqueValue) => {
                                // ignore empty values
                                // for now we don't handle empty
                                // #TODO - later we should allow user to map empty file value to a db value (we might want to map empty to LNG_REFERENCE_...NONE)
                                if (
                                    !fileUniqueValue ||
                                    fileUniqueValue.toLowerCase() === 'null'
                                ) {
                                    return;
                                }

                                // cache item
                                this.distinctValuesCache[key].push(new ImportableLabelValuePair(
                                    fileUniqueValue,
                                    fileUniqueValue,
                                    fileUniqueValue
                                ));
                            });
                        }

                        // finished
                        formattingHandler(
                            index + 1,
                            finishedCallback
                        );
                    }, 20);
                };

                // retrieve locations
                const retrieveLocations = (finishedCallback: () => void) => {
                    // create array of location names that we need to retrieve
                    const locationsToRetrieveMap: {
                        [locationIdName: string]: true
                    } = {};
                    _.each(mustRetrieveLocations, (N, key: string) => {
                        if (
                            this.distinctValuesCache[key] &&
                            this.distinctValuesCache[key].length > 0
                        ) {
                            // go through distinct values
                            this.distinctValuesCache[key].forEach((data) => {
                                // jump over if label not relevant
                                if (
                                    !data.label ||
                                    data.label.toLowerCase() === 'null'
                                ) {
                                    return;
                                }

                                // add to list of locations to retrieve
                                locationsToRetrieveMap[data.label] = true;
                            });

                            // also, in case we load saved mappings then we need to retrieve saved locations
                            if (importMappingFieldSubOptionsMap) {
                                distinctValuesForKeysMap[key].forEach((locationField) => {
                                    // do we have field source & destination, otherwise there is no point in continuing
                                    if (
                                        !locationField.sourceField ||
                                        !locationField.destinationField
                                    ) {
                                        return;
                                    }

                                    // go through each saved sub-option destination and make sure we retrieve that location too
                                    if (
                                        importMappingFieldSubOptionsMap[locationField.sourceField] &&
                                        importMappingFieldSubOptionsMap[locationField.sourceField][locationField.destinationField]
                                    ) {
                                        _.each(importMappingFieldSubOptionsMap[locationField.sourceField][locationField.destinationField], (destinationOptions: string[]) => {
                                            destinationOptions.forEach((locationId: string) => {
                                                locationsToRetrieveMap[locationId] = true;
                                            });
                                        });
                                    }
                                });
                            }
                        }
                    });

                    // do we have locations to retrieve ?
                    const locationsToRetrieve: string[] = Object.keys(locationsToRetrieveMap);
                    if (locationsToRetrieve.length < 1) {
                        // no locations to retrieve
                        finishedCallback();
                    } else {
                        // retrieve locations
                        const retrieveLocationsData = (locations: string[]): Observable<LocationModel[]> => {
                            // construct regular expression for case insensitive search for names
                            let nameRegex: string = '';
                            locations.forEach((location) => {
                                nameRegex = `${nameRegex}${nameRegex ? '|' : ''}(${RequestFilterGenerator.escapeStringForRegex(location)})`;
                            });

                            // configure search for current batch
                            const qb = new RequestQueryBuilder();
                            qb.filter.where({
                                or: [
                                    {
                                        // file location ids
                                        // saved mappings location ids
                                        id: {
                                            inq: locations
                                        }
                                    }, {
                                        // file location names
                                        name: {
                                            regexp: `/^(${nameRegex})$/i`
                                        }
                                    }
                                ]
                            });

                            // we need only specific data
                            qb.fields(
                                'id',
                                'name',
                                'parentLocationId'
                            );

                            // retrieve locations
                            return this.locationDataService
                                .getLocationsList(qb)
                                .pipe(
                                    catchError((err) => {
                                        // prepare data
                                        this.validateData();

                                        // hide loading
                                        loadingDialog.close();

                                        // show error
                                        this.snackbarService.showApiError(err);
                                        return throwError(err);
                                    })
                                );
                        };

                        // retrieve locations batch
                        const batchSize: number = 100;
                        let totalSize: number = locationsToRetrieve.length;
                        const retrieveLocationsBatch = (finishedBatchCallback: () => void) => {
                            // finished ?
                            if (locationsToRetrieve.length < 1) {
                                return finishedBatchCallback();
                            }

                            // formatting message
                            loadingDialog.showMessage(
                                'LNG_PAGE_IMPORT_DATA_MAPPING_RETRIEVING_LOCATIONS', {
                                    index: (totalSize - locationsToRetrieve.length).toString(),
                                    total: totalSize.toString()
                                }
                            );

                            // construct location batch
                            const batchLocations: string[] = locationsToRetrieve.splice(0, Math.min(locationsToRetrieve.length, batchSize));
                            retrieveLocationsData(batchLocations)
                                .subscribe((locationData) => {
                                    // cache locations
                                    locationData.forEach((location) => {
                                        // cache locations
                                        this.locationCache[location.id] = {
                                            label: location.name,
                                            parentsLoaded: !location.parentLocationId,
                                            shortLabel: location.name,
                                            parentId: location.parentLocationId
                                        };

                                        // index it
                                        this.indexLocation(
                                            location.name,
                                            location.id
                                        );
                                    });

                                    // retrieve parents too
                                    // must go again because we might've retrieved the location in the current request (cached above)
                                    // cache locations
                                    locationData.forEach((location) => {
                                        if (
                                            location.parentLocationId &&
                                            !this.locationCache[location.parentLocationId] &&
                                            !locationsToRetrieve.includes(location.parentLocationId)
                                        ) {
                                            // add to list
                                            locationsToRetrieve.push(location.parentLocationId);
                                            totalSize++;
                                        }
                                    });

                                    // next batch
                                    retrieveLocationsBatch(finishedBatchCallback);
                                });
                        };

                        // retrieve locations in batches
                        retrieveLocationsBatch(() => {
                            // finished retrieving locations
                            finishedCallback();
                        });
                    }
                };

                // relabel child locations
                const reLabelLocations = (finishedCallback: () => void) => {
                    // display message
                    loadingDialog.showMessage('LNG_PAGE_IMPORT_DATA_MAPPING_RETRIEVING_RELABEL_LOCATIONS');

                    // wait for bindings to have effect
                    setTimeout(() => {
                        // go through each location and set the proper name
                        _.each(this.locationCache, (locationCacheItem) => {
                            // finished with this one
                            if (locationCacheItem.parentsLoaded) {
                                return;
                            }

                            // location handled
                            locationCacheItem.parentsLoaded = true;

                            // determine parents name
                            let parent = locationCacheItem.parentId && this.locationCache[locationCacheItem.parentId] ?
                                this.locationCache[locationCacheItem.parentId] :
                                null;
                            let parentNames: string = '';
                            while (parent) {
                                // determine parents names
                                parentNames = `${parent.shortLabel}${parentNames ? ' => ' + parentNames : ''}`;

                                // next parent
                                parent = parent.parentId && this.locationCache[parent.parentId] ?
                                    this.locationCache[parent.parentId] :
                                    null;
                            }

                            // set the new name
                            locationCacheItem.label = `${parentNames ? parentNames + ' => ' : ''}${locationCacheItem.shortLabel}`;
                        });

                        // finished
                        finishedCallback();
                    }, 50);
                };

                // remap options
                const addMapOptions = (finishedCallback: () => void): void => {
                    // add map options
                    const addMapOptionsHandler = (
                        index: number,
                        finishedHandlerCallback: () => void
                    ) => {
                        // finished ?
                        if (index >= distinctValuesForKeys.length) {
                            finishedHandlerCallback();
                            return;
                        }

                        // determine key
                        const key: string = distinctValuesForKeys[index];

                        // formatting message
                        loadingDialog.showMessage(
                            'LNG_PAGE_IMPORT_DATA_MAPPING_DATA', {
                                index: (index + 1).toString(),
                                total: distinctValuesForKeys.length.toString(),
                                key: key
                            }
                        );

                        // process
                        setTimeout(() => {
                            // map options
                            distinctValuesForKeysMap[key].forEach((field) => {
                                this.addMapOptionsIfNecessary(
                                    field,
                                    true,
                                    importMappingFieldSubOptionsMap && field.sourceField && field.destinationField &&
                                        importMappingFieldSubOptionsMap[field.sourceField] && importMappingFieldSubOptionsMap[field.sourceField][field.destinationField] ?
                                            // fieldOptionSource => fieldOptionDestination[]
                                            importMappingFieldSubOptionsMap[field.sourceField][field.destinationField] :
                                            null
                                );
                            });

                            // finished
                            addMapOptionsHandler(
                                index + 1,
                                finishedHandlerCallback
                            );
                        }, 20);
                    };

                    // populate options
                    addMapOptionsHandler(
                        0,
                        () => {
                            finishedCallback();
                        }
                    );
                };

                // format field options
                formattingHandler(
                    0,
                    () => {
                        // initializing message
                        loadingDialog.showMessage('LNG_PAGE_IMPORT_DATA_RETRIEVING_LOCATIONS');

                        // retrieve locations
                        setTimeout(() => {
                            retrieveLocations(() => {
                                // relabel locations
                                reLabelLocations(() => {
                                    // remap locations
                                    addMapOptions(() => {
                                        // prepare data
                                        this.validateData();

                                        // hide loading
                                        loadingDialog.close();

                                        // display success
                                        this.snackbarService.showSuccess(
                                            'LNG_PAGE_IMPORT_DATA_MAPPING_FINISHED',
                                            {},
                                            SnackbarService.DURATION_INFINITE
                                        );
                                    });
                                });
                            });
                        }, 50);
                    }
                );
            });
    }

    /**
     * Mapped field option location changed handler
     */
    mappedOptionsLocationChanged(
        mappedOpt: IMappedOption,
        locationAutoItem: LocationAutoItem
    ): void {
        // nothing selected ?
        if (!locationAutoItem) {
            // reset value
            mappedOpt.destinationOption = null;

            // prepare data
            this.validateData();

            // finished
            return;
        }

        // cache location if necessary
        if (
            !this.locationCache[locationAutoItem.id] ||
            !this.locationCache[locationAutoItem.id].parentsLoaded
        ) {
            // retrieve parents labels
            let parentNames: string = '';
            let parentLocation = locationAutoItem.parent();
            while (parentLocation) {
                // add name
                parentNames = `${parentLocation.label}${parentNames ? ' => ' + parentNames : ''}`;

                // next parent
                parentLocation = parentLocation.parent();
            }

            // cache location
            this.locationCache[locationAutoItem.id] = {
                label: `${parentNames ? parentNames + ' => ' : ''}${locationAutoItem.label}`,
                parentsLoaded: true,
                shortLabel: locationAutoItem.label,
                parentId: locationAutoItem.parent() ?
                    locationAutoItem.parent().id :
                    null
            };

            // index it
            this.indexLocation(
                locationAutoItem.label,
                locationAutoItem.id
            );
        }

        // set option value
        mappedOpt.destinationOption = locationAutoItem.id;

        // prepare data
        this.validateData();
    }

    /**
     * Determine & retrieve map option height
     */
    getFieldMapOptionsHeight(
        mapOptionViewport: CdkVirtualScrollViewport,
        field: ImportableMapField
    ): string {
        // determine size
        const size: number = Math.min(
            100 * (field.mappedOptions ? field.mappedOptions.length : 0),
            350
        );

        // if changed we need to resize viewport
        if (mapOptionViewport.getViewportSize() !== size) {
            setTimeout(() => {
                try {
                    mapOptionViewport.checkViewportSize();
                } catch (e) {
                    // handle the case the item was removed due to parent virtual scroll
                }
            });
        }

        // return value
        return `${size}px`;
    }
}
