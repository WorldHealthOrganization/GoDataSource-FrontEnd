import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { environment } from '../../../../../environments/environment';
import { ImportableFileModel, ImportableLabelValuePair, ImportableMapField } from './model';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';

export enum ImportDataExtension {
    CSV = '.csv',
    XLS = '.xls',
    XLSX = '.xlsx',
    XML = '.xml',
    ODS = '.ods',
    JSON = '.json'
}

export enum ImportServerModelNames {
    CASE_LAB_RESULTS = 'labResult',
    OUTBREAK = 'outbreak',
    CASE = 'case',
    CONTACT = 'contact'
}

@Component({
    selector: 'app-import-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.less']
})
export class ImportDataComponent implements OnInit {
    // mimes
    private allowedMimeTypes: string[] = [];
    private allowedMimeTypesMap = {
        [ImportDataExtension.CSV]: 'text/csv',
        [ImportDataExtension.XLS]: 'application/vnd.ms-excel',
        [ImportDataExtension.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        [ImportDataExtension.XML]: 'text/xml',
        [ImportDataExtension.ODS]: 'application/vnd.oasis.opendocument.spreadsheet',
        [ImportDataExtension.JSON]: 'application/json'
    };

    // extensions
    private _allowedExtensions: string[];
    @Input() set allowedExtensions(extensions: string[]) {
        this._allowedExtensions = extensions;

        this.translationData.types = this.allowedExtensions.join(', ');

        this.allowedMimeTypes = this.allowedExtensions.map((extension: string): string => {
            return this.allowedMimeTypesMap[extension] ?
                this.allowedMimeTypesMap[extension] :
                extension;
        });

        if (this.uploader) {
            this.uploader.options.allowedMimeType = this.allowedMimeTypes;
        }
    }
    get allowedExtensions(): string[] {
        return this._allowedExtensions ? this._allowedExtensions : [];
    }

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

    // handle upload files
    uploader: FileUploader;

    // file over drop-zone
    hasFileOver: boolean = false;

    translationData: {
        types?: string
    } = {};

    progress: number = null;
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

    @Input() importSuccessMessage: string = 'LNG_PAGE_IMPORT_DATA_SUCCESS_MESSAGE';

    // finished - imported data with success
    @Output() finished = new EventEmitter<void>();

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

    @Input() fieldsWithoutTokens: {
        [property: string]: string
    } = {};

    importableObject: ImportableFileModel;

    mappedFields: ImportableMapField[] = [];

    fastMappedModelValues: {
        [path: string]: {
            value: any[] | null | undefined
        }
    } = {};

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private formHelper: FormHelperService
    ) {
        // fix mime issue - browser not supporting some of the mimes, empty was provided to mime Type which wasn't allowing user to upload teh files
        if (!(FileLikeObject.prototype as any)._createFromObjectPrev) {
            (FileLikeObject.prototype as any)._createFromObjectPrev = FileLikeObject.prototype._createFromObject;
            FileLikeObject.prototype._createFromObject = (file: File) => {
                (FileLikeObject.prototype as any)._createFromObjectPrev({
                    size: file.size,
                    type: file.type ?
                        file.type : (
                            file.name && file.name.lastIndexOf('.') > -1 ?
                                this.allowedMimeTypesMap[file.name.substr(file.name.lastIndexOf('.')).toLowerCase()] :
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
        // init uploader
        this.uploader = new FileUploader({
            allowedMimeType: this.allowedMimeTypes,
            authToken: this.authDataService.getAuthToken(),
            url: `${environment.apiUrl}/${this.importFileUrl}`,
            additionalParameter: {
                model: this._model
            }
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
        this.uploader.onErrorItem = () => {
            // display error
            this.displayError(
                'LNG_PAGE_IMPORT_DATA_ERROR_PROCESSING_FILE',
                true
            );
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
                try { jsonResponse = JSON.parse(response); } catch {}
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

                // construct importable file object
                this.importableObject = new ImportableFileModel(
                    jsonResponse,
                    (token: string): string => {
                        return this.i18nService.instant(token);
                    },
                    this.fieldsWithoutTokens
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

                // populate deducted mappings
                _.each(this.importableObject.suggestedFieldMapping, (destinationField: string, sourceField: string) => {
                    // create new possible map item
                    const importableItem = new ImportableMapField(
                        destinationField,
                        sourceField
                    );

                    // add options if necessary
                    this.addMapOptionsIfNecessary(importableItem);

                    // add to list
                    this.mappedFields.push(importableItem);
                });

// #TODO REMOVE ME
console.log(this.importableObject);
// #TODO END OF REMOVE ME

                // display form
                this._displayLoading = false;
                this._displayLoadingLocked = false;
                this.progress = null;
            }
        };
    }

    /**
     * Add drop-downs for mapping a drop-down type options
     * @param importableItem
     */
    addMapOptionsIfNecessary(importableItem: ImportableMapField) {
        // add all distinct source as items that we need to map
        importableItem.mappedOptions = [];
        const distinctValues: string[] = _.get(this.importableObject, `distinctFileColumnValuesKeyValue.${importableItem.sourceField}`, []);
        _.each(distinctValues, (distinctVal: ImportableLabelValuePair) => {
            // create map option with source
            const mapOpt: {
                sourceOption: string,
                destinationOption?: string
            } = {
                sourceOption: distinctVal.value
            };

            // check if we can find a proper destination option
            const sourceOptReduced: string = _.camelCase(mapOpt.sourceOption).toLowerCase();
            const destinationOpt = _.chain(this.importableObject)
                .get(`modelPropertyValues.${importableItem.destinationField}`, [])
                .find((modelItem: { id: string, label: string }) => {
                    return sourceOptReduced === _.camelCase(this.i18nService.instant(modelItem.label)).toLowerCase() ||
                        sourceOptReduced === _.camelCase(modelItem.id).toLowerCase() ||
                        sourceOptReduced === _.camelCase(modelItem.label).toLowerCase();
                })
                .value();

            // found a possible destination field
            if (destinationOpt !== undefined) {
                mapOpt.destinationOption = destinationOpt.id;
            }

            // add option
            importableItem.mappedOptions.push(mapOpt);
        });
    }

    /**
     * Display error
     * @param messageToken
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
     * @param e
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
     * Add new field map
     */
    addNewFieldMap() {
        // add new item
        this.mappedFields.push(new ImportableMapField());
    }

    /**
     * Add new field map option
     */
    addNewOptionMap(indexMapField: number) {
        // add new item
        this.mappedFields[indexMapField].mappedOptions.push({});
    }

    /**
     * Remove field map
     */
    removeFieldMap(index: number) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_IMPORT_FIELD_MAP')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // remove item
                    this.mappedFields.splice(index, 1);
                }
            });
    }

    /**
     * Remove field map option
     */
    removeOptionMap(indexMapField: number, indexMapOption: number) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_IMPORT_FIELD_MAP')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // remove item
                    this.mappedFields[indexMapField].mappedOptions.splice(indexMapOption, 1);
                }
            });
    }

    /**
     * Retrieve model possible values
     * @param path
     */
    getModelPropertyValues(path: string) {
        // construct the full path
        path = '[' + path + ']';

        // bring values only if we didn't bring them before already
        if (!this.fastMappedModelValues[path]) {
            // retrieve value
            this.fastMappedModelValues[path] = {
                value: _.get(this.importableObject.modelPropertyValues, path)
            };
        }

        // return values
        return this.fastMappedModelValues[path].value;
    }

    /**
     * Import data
     * @param form
     */
    importData(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // display fields with data
        const dirtyFields: any = this.formHelper.getFields(form);
        console.log(dirtyFields);
    }
}
